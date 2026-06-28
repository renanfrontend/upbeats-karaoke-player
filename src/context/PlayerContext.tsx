import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Track } from "@/services/spotifyApi";

interface PlayerContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  // Create the single shared audio element once.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, []);

  // Keep the element volume in sync.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (isMuted ? 0 : volume) / 100;
    }
  }, [volume, isMuted]);

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

    if (autoplay) {
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.error("Error playing audio:", err);
          setIsPlaying(false);
          toast.error(t("player.playbackError"));
        });
      }
    }
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
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.error("Error playing audio:", err);
          setIsPlaying(false);
          toast.error(t("player.playbackError"));
        });
      }
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
