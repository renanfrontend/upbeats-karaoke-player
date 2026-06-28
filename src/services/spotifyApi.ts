
// Real music data service.
// - Track metadata, artwork and 30s audio previews come from the iTunes Search API
//   (free, no API key). We use JSONP so it works from a static site with no CORS setup.
// - Time-synced karaoke lyrics come from LRCLIB (https://lrclib.net), a free open API.
// Everything degrades gracefully to local fallback data if a request fails.

import { toast } from "sonner";

// Types for our data model
export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  albumTitle: string;
  coverImage: string;
  duration: number;
  previewUrl?: string;
}

export interface Lyrics {
  id: string;
  trackId: string;
  synced: boolean;
  lines: Array<{
    text: string;
    time: number;
  }>;
}

const FALLBACK_IMG = `${import.meta.env.BASE_URL}placeholder.svg`;

// ---------------------------------------------------------------------------
// JSONP helper (iTunes Search API supports a `callback` param on search/lookup)
// ---------------------------------------------------------------------------
let jsonpCounter = 0;

function jsonp<T = unknown>(
  baseUrl: string,
  params: Record<string, string>,
  timeoutMs = 8000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `__upbeats_jsonp_${Date.now()}_${jsonpCounter++}`;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      settled = true;
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error("JSONP request timed out"));
      }
    }, timeoutMs);

    (window as unknown as Record<string, unknown>)[callbackName] = (data: T) => {
      if (settled) return;
      cleanup();
      resolve(data);
    };

    const qs = new URLSearchParams({ ...params, callback: callbackName }).toString();
    script.src = `${baseUrl}?${qs}`;
    script.onerror = () => {
      if (!settled) {
        cleanup();
        reject(new Error("JSONP request failed"));
      }
    };
    document.head.appendChild(script);
  });
}

interface ITunesResult {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  artistId?: number;
  collectionName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  previewUrl?: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesResult[];
}

const ITUNES_SEARCH = "https://itunes.apple.com/search";
const ITUNES_LOOKUP = "https://itunes.apple.com/lookup";

function upscaleArtwork(url?: string): string {
  if (!url) return FALLBACK_IMG;
  // iTunes returns 100x100; request a larger version for crisp covers.
  return url.replace(/\/\d+x\d+bb\./, "/600x600bb.");
}

function mapTrack(r: ITunesResult): Track {
  return {
    id: String(r.trackId),
    title: r.trackName ?? "Unknown",
    artist: r.artistName ?? "Unknown artist",
    artistId: String(r.artistId ?? ""),
    albumTitle: r.collectionName ?? "",
    coverImage: upscaleArtwork(r.artworkUrl100),
    duration: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 0,
    previewUrl: r.previewUrl,
  };
}

function isSong(r: ITunesResult): boolean {
  return r.kind === "song" && !!r.trackId && !!r.previewUrl;
}

// ---------------------------------------------------------------------------
// Fallback data (only used if iTunes is unreachable from the browser)
// ---------------------------------------------------------------------------
const FALLBACK_TRACKS: Track[] = [
  { id: "f1", title: "Hello", artist: "Adele", artistId: "fa1", albumTitle: "25", coverImage: FALLBACK_IMG, duration: 295 },
  { id: "f2", title: "Blinding Lights", artist: "The Weeknd", artistId: "fa2", albumTitle: "After Hours", coverImage: FALLBACK_IMG, duration: 200 },
  { id: "f3", title: "Perfect", artist: "Ed Sheeran", artistId: "fa3", albumTitle: "÷", coverImage: FALLBACK_IMG, duration: 263 },
  { id: "f4", title: "Believer", artist: "Imagine Dragons", artistId: "fa4", albumTitle: "Evolve", coverImage: FALLBACK_IMG, duration: 204 },
];

const FALLBACK_ARTISTS: Artist[] = [
  { id: "fa1", name: "Adele", imageUrl: FALLBACK_IMG },
  { id: "fa2", name: "The Weeknd", imageUrl: FALLBACK_IMG },
  { id: "fa3", name: "Ed Sheeran", imageUrl: FALLBACK_IMG },
  { id: "fa4", name: "Imagine Dragons", imageUrl: FALLBACK_IMG },
];

// Curated, karaoke-friendly songs with strong LRCLIB lyric coverage.
const CURATED_QUERIES = [
  "Adele Hello",
  "The Weeknd Blinding Lights",
  "Ed Sheeran Perfect",
  "Imagine Dragons Believer",
  "Queen Bohemian Rhapsody",
  "John Legend All of Me",
  "Bruno Mars Just the Way You Are",
  "Coldplay Yellow",
];

const POPULAR_ARTIST_NAMES = [
  "Adele",
  "The Weeknd",
  "Ed Sheeran",
  "Taylor Swift",
  "Bruno Mars",
  "Coldplay",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const getPopularArtists = async (): Promise<Artist[]> => {
  try {
    const results = await Promise.all(
      POPULAR_ARTIST_NAMES.map(async (name) => {
        try {
          const res = await jsonp<ITunesResponse>(ITUNES_SEARCH, {
            term: name,
            entity: "song",
            limit: "1",
          });
          const r = res.results?.[0];
          if (!r) return null;
          return {
            id: String(r.artistId ?? name),
            name: r.artistName ?? name,
            imageUrl: upscaleArtwork(r.artworkUrl100),
          } as Artist;
        } catch {
          return null;
        }
      })
    );
    const artists = results.filter((a): a is Artist => a !== null);
    return artists.length ? artists : FALLBACK_ARTISTS;
  } catch {
    return FALLBACK_ARTISTS;
  }
};

export const getTopTracks = async (): Promise<Track[]> => {
  try {
    const results = await Promise.all(
      CURATED_QUERIES.map(async (query) => {
        try {
          const res = await jsonp<ITunesResponse>(ITUNES_SEARCH, {
            term: query,
            entity: "song",
            limit: "1",
          });
          const r = res.results?.find(isSong);
          return r ? mapTrack(r) : null;
        } catch {
          return null;
        }
      })
    );
    const tracks = results.filter((t): t is Track => t !== null);
    return tracks.length ? tracks : FALLBACK_TRACKS;
  } catch {
    return FALLBACK_TRACKS;
  }
};

export const getTrackById = async (trackId: string): Promise<Track | undefined> => {
  if (!trackId) return undefined;
  try {
    const res = await jsonp<ITunesResponse>(ITUNES_LOOKUP, { id: trackId });
    const r = res.results?.[0];
    if (r && r.trackId) return mapTrack(r);
  } catch {
    /* fall through to fallback */
  }
  return FALLBACK_TRACKS.find((t) => t.id === trackId);
};

export const searchTracks = async (query: string): Promise<Track[]> => {
  if (!query.trim()) return [];
  try {
    const res = await jsonp<ITunesResponse>(ITUNES_SEARCH, {
      term: query,
      entity: "song",
      limit: "25",
    });
    return (res.results ?? []).filter(isSong).map(mapTrack);
  } catch {
    const q = query.toLowerCase();
    return FALLBACK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }
};

// Find a single best-matching track for a free-text query (used by Library rows).
export const findTrack = async (query: string): Promise<Track | undefined> => {
  const results = await searchTracks(query);
  return results[0];
};

// ---------------------------------------------------------------------------
// Lyrics (LRCLIB) with LRC parsing
// ---------------------------------------------------------------------------
interface LrclibResponse {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

function parseLrc(lrc: string): Array<{ text: string; time: number }> {
  const timeTag = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
  const out: Array<{ text: string; time: number }> = [];

  for (const rawLine of lrc.split("\n")) {
    timeTag.lastIndex = 0;
    const times: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = timeTag.exec(rawLine)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const frac = match[3]
        ? parseInt(match[3].padEnd(3, "0").slice(0, 3), 10) / 1000
        : 0;
      times.push(minutes * 60 + seconds + frac);
    }
    if (!times.length) continue;
    const text = rawLine.replace(timeTag, "").trim();
    for (const time of times) {
      out.push({ text: text || "♪", time });
    }
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

async function fetchLrclib(track: Track): Promise<LrclibResponse | null> {
  // Primary: exact get
  const getParams = new URLSearchParams({
    track_name: track.title,
    artist_name: track.artist,
  });
  if (track.albumTitle) getParams.set("album_name", track.albumTitle);
  if (track.duration) getParams.set("duration", String(track.duration));

  try {
    const res = await fetch(`https://lrclib.net/api/get?${getParams.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as LrclibResponse;
      if (data.syncedLyrics || data.plainLyrics) return data;
    }
  } catch {
    /* try search next */
  }

  // Fallback: fuzzy search
  try {
    const q = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
    });
    const res = await fetch(`https://lrclib.net/api/search?${q.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const list = (await res.json()) as LrclibResponse[];
      const best = list.find((l) => l.syncedLyrics) ?? list[0];
      if (best) return best;
    }
  } catch {
    /* give up */
  }

  return null;
}

export const getLyricsByTrackId = async (
  trackId: string
): Promise<Lyrics | undefined> => {
  const track = await getTrackById(trackId);
  if (!track) return undefined;

  const data = await fetchLrclib(track);
  if (!data) return undefined;

  if (data.syncedLyrics) {
    const lines = parseLrc(data.syncedLyrics);
    if (lines.length) {
      return { id: `lyrics-${trackId}`, trackId, synced: true, lines };
    }
  }

  if (data.plainLyrics) {
    // No timing available: show plain lines without sync.
    const lines = data.plainLyrics
      .split("\n")
      .map((text) => ({ text: text.trim() || "♪", time: 0 }));
    return { id: `lyrics-${trackId}`, trackId, synced: false, lines };
  }

  return undefined;
};

export const authenticateSpotify = async () => {
  toast("Authentication is not required — using iTunes & LRCLIB public APIs.");
  return true;
};
