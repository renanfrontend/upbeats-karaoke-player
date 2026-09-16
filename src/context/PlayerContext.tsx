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
import { KaraokeAudioEngine, type MicEnvironment } from "@/audio/karaokeEngine";

interface PlayerContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  /** 0 = original voice removed, 100 = untouched recording. */
  vocalLevel: number;
  setVocalLevel: (level: number) => void;
  /** False when the current source can't be processed (no CORS / no Web Audio). */
  vocalControlAvailable: boolean;
  micEnabled: boolean;
  micVolume: number;
  micEcho: number;
  micEnvironment: MicEnvironment;
  toggleMic: () => Promise<void>;
  setMicVolume: (v: number) => void;
  setMicEcho: (v: number) => void;
  setMicEnvironment: (env: MicEnvironment) => void;
  /** Exposed for meters/visualizers; null when Web Audio is unavailable. */
  audioEngine: KaraokeAudioEngine | null;
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
  // Ref keeps the callbacks below stable across language changes.
  const tRef = useRef(t);
  tRef.current = t;

  const engineRef = useRef<KaraokeAudioEngine | null>(null);
  // Two elements: one wired into the Web Audio graph (requires the host to
  // allow cross-origin reads) and a plain one used when that fails, so a
  // single uncooperative track never breaks playback or the rest of the session.
  const processedRef = useRef<HTMLAudioElement | null>(null);
  const plainRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<HTMLAudioElement | null>(null);
  const corsBlockedRef = useRef<Set<string>>(new Set());
  const currentTrackRef = useRef<Track | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [vocalLevel, setVocalLevelState] = useState(100);
  const [vocalControlAvailable, setVocalControlAvailable] = useState(
    KaraokeAudioEngine.isSupported()
  );
  const [micEnabled, setMicEnabled] = useState(false);
  const [micVolume, setMicVolumeState] = useState(70);
  const [micEcho, setMicEchoState] = useState(30);
  const [micEnvironment, setMicEnvironmentState] = useState<MicEnvironment>("speakers");
  // Mirrored in state as well as a ref so meters and visualizers re-render once
  // the graph exists, instead of waiting for some unrelated update.
  const [audioEngine, setAudioEngine] = useState<KaraokeAudioEngine | null>(null);

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

  // Build both elements and the audio graph once.
  useEffect(() => {
    const engine = KaraokeAudioEngine.isSupported() ? new KaraokeAudioEngine() : null;
    engineRef.current = engine;
    setAudioEngine(engine);

    const plain = new Audio();
    plain.preload = "metadata";
    plainRef.current = plain;
    activeRef.current = plain;

    let processed: HTMLAudioElement | null = null;
    if (engine) {
      processed = new Audio();
      processed.preload = "metadata";
      processed.crossOrigin = "anonymous";
      processedRef.current = processed;
      try {
        engine.attachMusic(processed);
      } catch (err) {
        console.error("Web Audio unavailable, falling back to direct playback:", err);
        engineRef.current = null;
        setAudioEngine(null);
        processedRef.current = null;
        processed = null;
        setVocalControlAvailable(false);
      }
    }

    const elements = [plain, processed].filter(Boolean) as HTMLAudioElement[];
    // Only the element that is actually in use drives the UI state.
    const isActive = (el: HTMLAudioElement) => activeRef.current === el;

    const cleanups = elements.map((el) => {
      const onTimeUpdate = () => isActive(el) && setCurrentTime(el.currentTime);
      const onLoadedMetadata = () => isActive(el) && setDuration(el.duration || 0);
      const onPlay = () => isActive(el) && setIsPlaying(true);
      const onPause = () => isActive(el) && setIsPlaying(false);
      const onEnded = () => {
        if (!isActive(el)) return;
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const onError = () => {
        if (!isActive(el)) return;
        const track = currentTrackRef.current;
        const fallback = plainRef.current;
        // The processed element is the one subject to cross-origin rules:
        // retry this track on the plain element before giving up.
        if (el === processedRef.current && track?.previewUrl && fallback) {
          corsBlockedRef.current.add(track.id);
          const resumeAt = el.currentTime;
          const wasPlaying = !el.paused && !el.ended;
          el.pause();
          activeRef.current = fallback;
          setVocalControlAvailable(false);
          fallback.src = track.previewUrl;
          fallback.load();
          fallback.currentTime = resumeAt;
          if (wasPlaying) playSafely(fallback);
          toast.info(tRef.current("karaoke.vocalControlUnavailable"));
          return;
        }
        setIsPlaying(false);
        if (track?.previewUrl) toast.error(tRef.current("player.playbackError"));
      };

      el.addEventListener("timeupdate", onTimeUpdate);
      el.addEventListener("loadedmetadata", onLoadedMetadata);
      el.addEventListener("play", onPlay);
      el.addEventListener("pause", onPause);
      el.addEventListener("ended", onEnded);
      el.addEventListener("error", onError);

      return () => {
        el.removeEventListener("timeupdate", onTimeUpdate);
        el.removeEventListener("loadedmetadata", onLoadedMetadata);
        el.removeEventListener("play", onPlay);
        el.removeEventListener("pause", onPause);
        el.removeEventListener("ended", onEnded);
        el.removeEventListener("error", onError);
        el.pause();
      };
    });

    return () => {
      cleanups.forEach((fn) => fn());
      engineRef.current?.stopMic();
    };
  }, [playSafely]);

  // Keep both elements' volume in sync so switching sources is seamless.
  useEffect(() => {
    const level = (isMuted ? 0 : volume) / 100;
    if (plainRef.current) plainRef.current.volume = level;
    if (processedRef.current) processedRef.current.volume = level;
  }, [volume, isMuted]);

  const setVocalLevel = useCallback((level: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(level)));
    setVocalLevelState(clamped);
    engineRef.current?.setVocalLevel(clamped / 100);
  }, []);

  const setMicVolume = useCallback((v: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(v)));
    setMicVolumeState(clamped);
    engineRef.current?.setMicVolume(clamped / 100);
  }, []);

  const setMicEcho = useCallback((v: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(v)));
    setMicEchoState(clamped);
    engineRef.current?.setMicEcho(clamped / 100);
  }, []);

  const startMic = useCallback(
    async (environment: MicEnvironment) => {
      const engine = engineRef.current;
      if (!engine) {
        toast.info(tRef.current("karaoke.micUnsupported"));
        return false;
      }
      try {
        await engine.startMic(environment);
        engine.setMicVolume(micVolume / 100);
        engine.setMicEcho(micEcho / 100);
        return true;
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast.error(tRef.current("karaoke.micPermissionDenied"));
        return false;
      }
    },
    [micEcho, micVolume]
  );

  const toggleMic = useCallback(async () => {
    const engine = engineRef.current;
    if (micEnabled) {
      engine?.stopMic();
      setMicEnabled(false);
      toast.info(tRef.current("karaoke.micDisabled"));
      return;
    }
    if (await startMic(micEnvironment)) {
      setMicEnabled(true);
      toast.success(tRef.current("karaoke.micEnabled"));
    }
  }, [micEnabled, micEnvironment, startMic]);

  // Switching between speakers and headphones changes the capture constraints,
  // so the stream has to be re-acquired while monitoring is on.
  const setMicEnvironment = useCallback(
    (env: MicEnvironment) => {
      setMicEnvironmentState(env);
      if (micEnabled) void startMic(env);
    },
    [micEnabled, startMic]
  );

  const loadInto = useCallback(
    (track: Track, autoplay: boolean, newQueue?: Track[]) => {
      const plain = plainRef.current;
      if (!plain) return;

      const processed = processedRef.current;
      const canProcess = !!processed && !corsBlockedRef.current.has(track.id);
      const target = canProcess ? (processed as HTMLAudioElement) : plain;
      const other = target === plain ? processed : plain;

      other?.pause();
      other?.removeAttribute("src");
      activeRef.current = target;
      currentTrackRef.current = track;

      setCurrentTrack(track);
      setVocalControlAvailable(canProcess);
      if (newQueue) setQueue(newQueue);
      setCurrentTime(0);
      setDuration(track.duration || 0);

      if (!track.previewUrl) {
        target.removeAttribute("src");
        target.load();
        setIsPlaying(false);
        toast.info(tRef.current("player.noPreview"));
        return;
      }

      target.src = track.previewUrl;
      target.load();
      if (autoplay) playSafely(target);
    },
    [playSafely]
  );

  const togglePlay = useCallback(() => {
    const audio = activeRef.current;
    const track = currentTrackRef.current;
    if (!audio || !track) return;
    if (!track.previewUrl) {
      toast.info(tRef.current("player.noPreview"));
      return;
    }
    if (audio.paused) playSafely(audio);
    else audio.pause();
  }, [playSafely]);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      // Toggle if the same track is requested again.
      if (currentTrackRef.current?.id === track.id && activeRef.current?.src) {
        togglePlay();
        return;
      }
      loadInto(track, true, newQueue);
    },
    [loadInto, togglePlay]
  );

  const loadTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      if (currentTrackRef.current?.id === track.id) return;
      loadInto(track, false, newQueue);
    },
    [loadInto]
  );

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    if (activeRef.current) activeRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (v > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const track = currentTrackRef.current;
      if (!track || queue.length === 0) return;
      const idx = queue.findIndex((tk) => tk.id === track.id);
      if (idx === -1) return;
      loadInto(queue[(idx + dir + queue.length) % queue.length], true);
    },
    [loadInto, queue]
  );

  const value: PlayerContextValue = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    vocalLevel,
    setVocalLevel,
    vocalControlAvailable,
    micEnabled,
    micVolume,
    micEcho,
    micEnvironment,
    toggleMic,
    setMicVolume,
    setMicEcho,
    setMicEnvironment,
    audioEngine,
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
