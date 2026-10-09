// Biblioteca da pessoa: músicas curtidas, tocadas recentemente e ajustes de letra.
// Fica no aparelho (localStorage) e, com login, é sincronizada com a nuvem (src/services/cloudSync.ts).
import { useSyncExternalStore } from "react";
import type { Track } from "./spotifyApi";

export interface LibraryTrack {
  id: string;
  title: string;
  artist: string;
  albumTitle: string;
  coverImage: string;
  /** Arquivo do próprio aparelho ("Minhas músicas"): só toca onde o arquivo estiver salvo. */
  local: boolean;
  /** Quando foi curtida ou tocada (ms), usado para ordenar e para juntar dados de aparelhos diferentes. */
  at: number;
}

export interface LibraryState {
  liked: LibraryTrack[];
  recent: LibraryTrack[];
  /** Ajuste da letra por música, em segundos. */
  offsets: Record<string, { value: number; at: number }>;
  /** Curtidas desfeitas, para a remoção também valer nos outros aparelhos. */
  unliked: Record<string, number>;
  /** Nomes das "Minhas músicas" (os arquivos ficam em cada aparelho). */
  songs: LibrarySong[];
  /** Músicas tiradas da lista, para a remoção também valer nos outros aparelhos. */
  removedSongs: Record<string, number>;
}

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  size: number;
  at: number;
}

const STORAGE_KEY = "upbeats-library-v1";
const LEGACY_OFFSET_PREFIX = "upbeats-lyrics-offset:";
export const RECENT_LIMIT = 30;

const empty = (): LibraryState => ({ liked: [], recent: [], offsets: {}, unliked: {}, songs: [], removedSongs: {} });

const read = (): LibraryState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<LibraryState>) };
  } catch {
    /* sem armazenamento (aba anônima): começa vazio */
  }
  return empty();
};

let state: LibraryState = typeof window === "undefined" ? empty() : read();
const listeners = new Set<() => void>();
const changeListeners = new Set<(next: LibraryState) => void>();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* segue só na memória */
  }
};

const commit = (next: LibraryState, { notifyCloud = true } = {}) => {
  state = next;
  persist();
  listeners.forEach((listener) => listener());
  if (notifyCloud) changeListeners.forEach((listener) => listener(state));
};

export const getLibrary = () => state;

export const subscribeLibrary = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Avisado a cada mudança feita neste aparelho (a sincronização usa para enviar à nuvem). */
export const onLocalLibraryChange = (listener: (next: LibraryState) => void) => {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
};

export const useLibrary = () => useSyncExternalStore(subscribeLibrary, getLibrary, getLibrary);

const toLibraryTrack = (track: Track, at: number): LibraryTrack => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  albumTitle: track.albumTitle ?? "",
  // Arquivos locais usam URLs temporárias (blob:), que não valem depois.
  coverImage: track.coverImage?.startsWith("blob:") ? "" : track.coverImage ?? "",
  local: track.id.startsWith("local-"),
  at,
});

export const isLiked = (id: string) => state.liked.some((item) => item.id === id);

export const toggleLike = (track: Track) => {
  const now = Date.now();
  if (isLiked(track.id)) {
    commit({ ...state, liked: state.liked.filter((item) => item.id !== track.id), unliked: { ...state.unliked, [track.id]: now } });
    return false;
  }
  const { [track.id]: _removed, ...unliked } = state.unliked;
  void _removed;
  commit({ ...state, liked: [toLibraryTrack(track, now), ...state.liked], unliked });
  return true;
};

export const recordPlay = (track: Track) => {
  const now = Date.now();
  const recent = [toLibraryTrack(track, now), ...state.recent.filter((item) => item.id !== track.id)].slice(0, RECENT_LIMIT);
  commit({ ...state, recent });
};

export const clearRecent = () => commit({ ...state, recent: [] });

export const rememberSong = (song: Omit<LibrarySong, "at">) => {
  const { [song.id]: _removed, ...removedSongs } = state.removedSongs;
  void _removed;
  commit({ ...state, songs: [{ ...song, at: Date.now() }, ...state.songs.filter((item) => item.id !== song.id)], removedSongs });
};

export const forgetSong = (id: string) => {
  commit({ ...state, songs: state.songs.filter((item) => item.id !== id), removedSongs: { ...state.removedSongs, [id]: Date.now() } });
};

export const getOffset = (id: string): number => {
  const saved = state.offsets[id];
  if (saved) return saved.value;
  // Ajustes feitos antes da biblioteca existir.
  try {
    const legacy = Number(localStorage.getItem(LEGACY_OFFSET_PREFIX + id));
    if (Number.isFinite(legacy)) return legacy;
  } catch {
    /* sem armazenamento */
  }
  return 0;
};

export const setOffset = (id: string, value: number) => {
  commit({ ...state, offsets: { ...state.offsets, [id]: { value, at: Date.now() } } });
};

/** Junta duas bibliotecas (deste aparelho e da nuvem): vale o registro mais recente de cada item. */
export const mergeLibraries = (a: LibraryState, b: LibraryState): LibraryState => {
  const tombstones = (x: Record<string, number> = {}, y: Record<string, number> = {}) => {
    const out = { ...x };
    for (const [id, at] of Object.entries(y)) out[id] = Math.max(out[id] ?? 0, at);
    return out;
  };
  const unliked = tombstones(a.unliked, b.unliked);
  const removedSongs = tombstones(a.removedSongs, b.removedSongs);

  const newest = <T extends { id: string; at: number }>(items: T[]) => {
    const byId = new Map<string, T>();
    for (const item of items) {
      const current = byId.get(item.id);
      if (!current || item.at > current.at) byId.set(item.id, item);
    }
    return [...byId.values()].sort((x, y) => y.at - x.at);
  };

  // Uma curtida só fica se for mais nova que a última vez que foi desfeita.
  const liked = newest([...a.liked, ...(b.liked ?? [])]).filter((item) => !(unliked[item.id] >= item.at));
  for (const item of liked) delete unliked[item.id];

  const offsets = { ...a.offsets };
  for (const [id, entry] of Object.entries(b.offsets ?? {})) {
    if (!offsets[id] || entry.at > offsets[id].at) offsets[id] = entry;
  }

  const songs = newest([...(a.songs ?? []), ...(b.songs ?? [])]).filter((item) => !(removedSongs[item.id] >= item.at));
  for (const item of songs) delete removedSongs[item.id];

  return { liked, recent: newest([...a.recent, ...(b.recent ?? [])]).slice(0, RECENT_LIMIT), offsets, unliked, songs, removedSongs };
};

/** Aplica dados vindos da nuvem sem reenviá-los. */
export const applyRemoteLibrary = (remote: LibraryState) => {
  commit(mergeLibraries(state, remote), { notifyCloud: false });
};
