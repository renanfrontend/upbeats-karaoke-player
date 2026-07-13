import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Track } from "@/services/spotifyApi";
import { KaraokeEngine } from "@/audio/karaokeEngine";

interface PlayerContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  /** Vocal removal (karaoke) mode. */
  karaokeMode: boolean;
  /** How much of the voice to remove, 0–100. */
  vocalReduction: number;
  /** False when the audio source can't be processed (no CORS / no Web Audio). */
  karaokeSupported: boolean;
  setKaraokeMode: (on: boolean) => void;
  setVocalReduction: (level: number) => void;
  /** Load a track (and optional queue) and start playing it. */
  playTrack: (track: Track, queue?: Track[]) => void;
  /** Load a track as current without auto-playing (e.g. karaoke page). */
  loadTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  next: () => void;
  prev: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  // Ref keeps callbacks below stable across language changes (t changes identity).
  const tRef = useRef(t);
  tRef.current = t;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const detachAudioRef = useRef<(() => void) | null>(null);
  const engineRef = useRef<KaraokeEngine | null>(null);
  // Whether the current element was created with crossOrigin (required for
  // Web Audio processing). Cleared after a CORS-related load failure.
  const corsEnabledRef = useRef(true);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [karaokeMode, setKaraokeModeState] = useState(false);
  const [vocalReduction, setVocalReductionState] = useState(100);
  const [karaokeSupported, setKaraokeSupported] = useState(true);

  const playSafely = useCallback((audio: HTMLAudioElement) => {
    engineRef.current?.resume();
    const p = audio.play();
    if (p !== undefined) {
      p.catch((err) => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
        toast.error(tRef.current("player.playbackError"));
      });
    }
  }, []);

  // Build the shared audio element. Rebuilt once (without crossOrigin) if the
  // preview host turns out not to send CORS headers — in that case playback
  // still works but vocal removal is unavailable.
  const buildAudio = useCallback(
    (withCors: boolean) => {
      detachAudioRef.current?.();

      const audio = new Audio();
      audio.preload = "metadata";
      if (withCors) audio.crossOrigin = "anonymous";
      corsEnabledRef.current = withCors;
      audioRef.current = audio;

      const onTimeUpdate = () => setCurrentTime(audio.currentTime);
      const onLoadedMetadata = () => setDuration(audio.duration || 0);
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const onError = () => {
        if (corsEnabledRef.current && audio.currentSrc) {
          // Likely a CORS rejection: retry the same source on a plain element.
          const src = audio.currentSrc;
          const wasPlaying = !audio.paused && !audio.ended;
          setKaraokeSupported(false);
          setKaraokeModeState(false);
          engineRef.current?.dispose();
          engineRef.current = null;
          const plain = buildAudio(false);
          plain.src = src;
          plain.load();
          if (wasPlaying) playSafely(plain);
          return;
        }
        setIsPlaying(false);
      };

      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);

      detachAudioRef.current = () => {
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audio.pause();
      };

      return audio;
    },
    [playSafely]
  );

  useEffect(() => {
    buildAudio(true);
    return () => {
      detachAudioRef.current?.();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [buildAudio]);

  // Keep the element volume in sync.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (isMuted ? 0 : volume) / 100;
    }
  }, [volume, isMuted]);

  const setKaraokeMode = useCallback(
    (on: boolean) => {
      const audio = audioRef.current;
      if (!on) {
        engineRef.current?.setMode(false, vocalReduction / 100);
        setKaraokeModeState(false);
        return;
      }
      if (!audio || !karaokeSupported || !corsEnabledRef.current) {
        toast.info(t("karaoke.vocalRemovalUnsupported"));
        return;
      }
      try {
        if (!engineRef.current) engineRef.current = new KaraokeEngine();
        engineRef.current.attach(audio);
        engineRef.current.resume();
        engineRef.current.setMode(true, vocalReduction / 100);
        setKaraokeModeState(true);
      } catch (err) {
        console.error("Failed to enable vocal removal:", err);
        engineRef.current?.dispose();
        engineRef.current = null;
        setKaraokeSupported(false);
        toast.info(t("karaoke.vocalRemovalUnsupported"));
      }
    },
    [karaokeSupported, t, vocalReduction]
  );

  const setVocalReduction = useCallback(
    (level: number) => {
      const clamped = Math.min(100, Math.max(0, level));
      setVocalReductionState(clamped);
      engineRef.current?.setMode(karaokeMode, clamped / 100);
    },
    [karaokeMode]
  );

  const loadInto = (track: Track, autoplay: boolean, newQueue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    if (!track.previewUrl) {
      audio.removeAttribute("src");
      audio.load();
      setIsPlaying(false);
      toast.info(t("player.noPreview"));
      return;
    }

    audio.src = track.previewUrl;
    audio.load();

    if (autoplay) playSafely(audio);
  };

  const playTrack = (track: Track, newQueue?: Track[]) => {
    // Toggle if the same track is requested again.
    if (currentTrack && currentTrack.id === track.id && audioRef.current?.src) {
      togglePlay();
      return;
    }
    loadInto(track, true, newQueue);
  };

  const loadTrack = (track: Track, newQueue?: Track[]) => {
    if (currentTrack && currentTrack.id === track.id) return;
    loadInto(track, false, newQueue);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (!currentTrack.previewUrl) {
      toast.info(t("player.noPreview"));
      return;
    }
    if (audio.paused) {
      playSafely(audio);
    } else {
      audio.pause();
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (v > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((m) => !m);

  const step = (dir: 1 | -1) => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((tk) => tk.id === currentTrack.id);
    if (idx === -1) return;
    const nextIdx = (idx + dir + queue.length) % queue.length;
    loadInto(queue[nextIdx], true);
  };

  const value: PlayerContextValue = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    karaokeMode,
    vocalReduction,
    karaokeSupported,
    setKaraokeMode,
    setVocalReduction,
    playTrack,
    loadTrack,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next: () => step(1),
    prev: () => step(-1),
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
};
