// "Minhas músicas": arquivos de áudio que a pessoa escolheu, guardados no próprio
// aparelho (IndexedDB). Nada é enviado a servidor algum. Os metadados ficam
// separados dos arquivos para a lista abrir rápido, sem carregar áudio.

export interface SavedSong {
  /** Mesmo formato usado pelo player para arquivos locais ("local-<nome>-<tamanho>"). */
  id: string;
  title: string;
  artist: string;
  size: number;
  addedAt: number;
}

const DB_NAME = "upbeats-my-songs";
const META = "songs";
const FILES = "files";

const open = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(META, { keyPath: "id" });
      db.createObjectStore(FILES);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const done = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const request = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/** "Artista - Música.mp3" vira { artist, title }; sem hífen, só o título. */
export const parseSongName = (fileName: string, fallbackArtist: string) => {
  const name = fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
  const dash = name.indexOf(" - ");
  const artist = dash > 0 ? name.slice(0, dash).trim() : fallbackArtist;
  const title = dash > 0 ? name.slice(dash + 3).trim() : name.trim();
  return { artist, title: title || name };
};

export const songIdForFile = (file: File) => `local-${file.name}-${file.size}`;

export const isSupported = () => typeof indexedDB !== "undefined";

/** Pede ao navegador para não apagar as músicas quando faltar espaço. */
export const requestPersistence = async () => {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    /* sem persistência garantida, mas as músicas continuam salvas */
  }
};

export const listSongs = async (): Promise<SavedSong[]> => {
  const db = await open();
  const songs = await request(db.transaction(META).objectStore(META).getAll() as IDBRequest<SavedSong[]>);
  db.close();
  return songs.sort((a, b) => b.addedAt - a.addedAt);
};

/** Salva (ou atualiza) o arquivo. O mesmo arquivo escolhido de novo não duplica. */
export const saveSong = async (file: File, fallbackArtist: string): Promise<SavedSong> => {
  const song: SavedSong = {
    id: songIdForFile(file),
    ...parseSongName(file.name, fallbackArtist),
    size: file.size,
    addedAt: Date.now(),
  };
  const db = await open();
  const tx = db.transaction([META, FILES], "readwrite");
  tx.objectStore(META).put(song);
  tx.objectStore(FILES).put(file, song.id);
  await done(tx);
  db.close();
  return song;
};

export const getSongFile = async (id: string): Promise<Blob | undefined> => {
  const db = await open();
  const blob = await request(db.transaction(FILES).objectStore(FILES).get(id) as IDBRequest<Blob | undefined>);
  db.close();
  return blob;
};

export const removeSong = async (id: string): Promise<void> => {
  const db = await open();
  const tx = db.transaction([META, FILES], "readwrite");
  tx.objectStore(META).delete(id);
  tx.objectStore(FILES).delete(id);
  await done(tx);
  db.close();
};
