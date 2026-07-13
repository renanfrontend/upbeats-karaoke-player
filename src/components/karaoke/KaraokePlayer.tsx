
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, MicVocal, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { usePlayer } from '@/context/PlayerContext';
import { MicMonitor } from '@/audio/karaokeEngine';

interface Lyric {
  text: string;
  time: number;
}

interface KaraokePlayerProps {
  lyrics: Lyric[];
  currentTime: number;
  isPlaying: boolean;
  synced?: boolean;
  /** Used to persist the lyrics offset per song. */
  trackId?: string;
}

const OFFSET_STORAGE_PREFIX = 'upbeats-lyrics-offset:';
const OFFSET_STEP = 0.5;

const loadOffset = (trackId?: string): number => {
  if (!trackId) return 0;
  const raw = localStorage.getItem(OFFSET_STORAGE_PREFIX + trackId);
  const value = raw === null ? NaN : parseFloat(raw);
  return isFinite(value) ? value : 0;
};

const KaraokePlayer: React.FC<KaraokePlayerProps> = ({
  lyrics,
  currentTime,
  isPlaying,
  synced = true,
  trackId,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(70);
  const micMonitorRef = useRef<MicMonitor | null>(null);

  const {
    karaokeMode,
    vocalReduction,
    karaokeSupported,
    setKaraokeMode,
    setVocalReduction,
  } = usePlayer();

  // Per-song lyric calibration: shifts lyric timestamps relative to the audio.
  const [offset, setOffset] = useState(() => loadOffset(trackId));
  useEffect(() => {
    setOffset(loadOffset(trackId));
  }, [trackId]);

  const applyOffset = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    setOffset(rounded);
    if (trackId) {
      localStorage.setItem(OFFSET_STORAGE_PREFIX + trackId, String(rounded));
    }
  };

  const adjustedTime = currentTime + offset;

  const activeLyricIndex = useMemo(() => {
    if (!synced) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (adjustedTime >= lyrics[i].time) index = i;
      else break;
    }
    return index;
  }, [adjustedTime, lyrics, synced]);

  // Progress inside the active line, used for the karaoke-style text fill.
  const activeProgress = useMemo(() => {
    if (activeLyricIndex < 0) return 0;
    const line = lyrics[activeLyricIndex];
    const next = lyrics[activeLyricIndex + 1];
    if (!next || next.time <= line.time) return 1;
    return Math.min(1, Math.max(0, (adjustedTime - line.time) / (next.time - line.time)));
  }, [activeLyricIndex, adjustedTime, lyrics]);

  // Effect to scroll to active lyric
  useEffect(() => {
    if (!synced) return;
    if (containerRef.current && activeLyricIndex >= 0) {
      const lyricElements = containerRef.current.querySelectorAll('.lyrics');
      if (lyricElements[activeLyricIndex]) {
        lyricElements[activeLyricIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeLyricIndex, synced]);

  // Tap the line being sung right now to calibrate the lyrics to the music.
  const syncToLine = (index: number) => {
    if (!synced || !isPlaying) return;
    applyOffset(lyrics[index].time - currentTime);
    toast.success(t('karaoke.lyricsSynced'));
  };

  // Microphone handling: capture the singer's voice and monitor it through the
  // speakers with a light echo (MicMonitor).
  const toggleMicrophone = async () => {
    try {
      if (!micEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        micMonitorRef.current = new MicMonitor(stream, micVolume / 100);
        setMicEnabled(true);
        toast.success(t('karaoke.micEnabled'));
      } else {
        micMonitorRef.current?.dispose();
        micMonitorRef.current = null;
        setMicEnabled(false);
        toast.info(t('karaoke.micDisabled'));
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error(t('karaoke.micPermissionDenied'));
    }
  };

  useEffect(() => {
    micMonitorRef.current?.setVolume(micVolume / 100);
  }, [micVolume]);

  useEffect(() => {
    return () => {
      micMonitorRef.current?.dispose();
      micMonitorRef.current = null;
    };
  }, []);

  return (
    <div className="bg-secondary/20 rounded-lg p-6 border border-secondary">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">{t('karaoke.title')}</h2>
        <Button
          onClick={toggleMicrophone}
          variant={micEnabled ? "default" : "outline"}
          size="sm"
          className={micEnabled ? "bg-upbeats-500 hover:bg-upbeats-600" : ""}
        >
          {micEnabled ? (
            <>
              <Mic className="h-5 w-5 mr-2" />
              {t('karaoke.micOn')}
            </>
          ) : (
            <>
              <MicOff className="h-5 w-5 mr-2" />
              {t('karaoke.micOff')}
            </>
          )}
        </Button>
      </div>

      {/* Vocal removal controls */}
      <div className="rounded-lg bg-secondary/30 p-4 mb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MicVocal className="h-5 w-5 text-upbeats-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium leading-tight">{t('karaoke.vocalRemoval')}</p>
              <p className="text-xs text-muted-foreground truncate">
                {karaokeSupported
                  ? t('karaoke.vocalRemovalDesc')
                  : t('karaoke.vocalRemovalUnsupported')}
              </p>
            </div>
          </div>
          <Switch
            checked={karaokeMode}
            disabled={!karaokeSupported}
            onCheckedChange={setKaraokeMode}
          />
        </div>
        {karaokeMode && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t('karaoke.vocalLevel')}
            </span>
            <Slider
              value={[vocalReduction]}
              min={30}
              max={100}
              step={5}
              className="flex-1"
              onValueChange={(v) => setVocalReduction(v[0])}
            />
            <span className="text-xs text-muted-foreground w-9 text-right">
              {vocalReduction}%
            </span>
          </div>
        )}
        {micEnabled && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t('karaoke.micVolume')}
            </span>
            <Slider
              value={[micVolume]}
              max={100}
              step={1}
              className="flex-1"
              onValueChange={(v) => setMicVolume(v[0])}
            />
            <span className="text-xs text-muted-foreground w-9 text-right">
              {micVolume}%
            </span>
          </div>
        )}
      </div>

      {/* Audio Visualizer */}
      <div className="visualizer mb-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "transition-all duration-100",
              isPlaying ? `animate-wave-${(i % 3) + 1}` : "h-1"
            )}
            style={{
              height: isPlaying ? `${Math.random() * 30 + 5}px` : "3px",
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>

      {/* Lyrics calibration */}
      {synced && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
          <span>{t('karaoke.lyricsSync')}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => applyOffset(offset - OFFSET_STEP)}
            aria-label={t('karaoke.lyricsEarlier')}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-12 text-center font-mono">
            {offset > 0 ? '+' : ''}{offset.toFixed(1)}s
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => applyOffset(offset + OFFSET_STEP)}
            aria-label={t('karaoke.lyricsLater')}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          {offset !== 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => applyOffset(0)}
              aria-label={t('karaoke.lyricsSyncReset')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <span className="basis-full text-center opacity-70">
            {t('karaoke.tapToSync')}
          </span>
        </div>
      )}

      {/* Lyrics Display */}
      <div ref={containerRef} className="lyricsContainer scrollbar-hidden">
        {lyrics.map((lyric, index) => {
          const isActive = synced && activeLyricIndex === index;
          return (
            <div
              key={index}
              onClick={() => syncToLine(index)}
              className={cn(
                "lyrics text-center transition-all",
                synced && isPlaying && "cursor-pointer hover:opacity-80",
                isActive && "active"
              )}
            >
              {isActive ? (
                <span
                  className="lyricFill"
                  style={{
                    backgroundImage: `linear-gradient(90deg, #9b75ff ${activeProgress * 100}%, rgba(255,255,255,0.45) ${activeProgress * 100}%)`,
                  }}
                >
                  {lyric.text}
                </span>
              ) : (
                lyric.text
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KaraokePlayer;
