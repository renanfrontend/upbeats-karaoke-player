
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePlayer } from '@/context/PlayerContext';
import { AudioVisualizer } from './AudioVisualizer';
import VoiceControls from './VoiceControls';

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
/** A silent stretch this long earns a count-in before the next line. */
const COUNT_IN_SECONDS = 3;

// localStorage throws in private mode and when site data is blocked, and the
// lyrics have to keep working either way.
const readStoredOffset = (trackId?: string): number => {
  if (!trackId) return 0;
  try {
    const raw = localStorage.getItem(OFFSET_STORAGE_PREFIX + trackId);
    const value = raw === null ? NaN : parseFloat(raw);
    return isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

const writeStoredOffset = (trackId: string | undefined, value: number): void => {
  if (!trackId) return;
  try {
    localStorage.setItem(OFFSET_STORAGE_PREFIX + trackId, String(value));
  } catch {
    /* calibration just won't survive a reload */
  }
};

const KaraokePlayer: React.FC<KaraokePlayerProps> = ({
  lyrics,
  currentTime,
  isPlaying,
  synced = true,
  trackId,
}) => {
  const { t } = useTranslation();
  const { audioEngine } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);

  // Per-song lyric calibration: shifts lyric timestamps against the audio.
  const [offset, setOffset] = useState(() => readStoredOffset(trackId));
  useEffect(() => {
    setOffset(readStoredOffset(trackId));
  }, [trackId]);

  const applyOffset = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    setOffset(rounded);
    writeStoredOffset(trackId, rounded);
  };

  const adjustedTime = currentTime + offset;

  const activeIndex = useMemo(() => {
    if (!synced) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (adjustedTime >= lyrics[i].time) index = i;
      else break;
    }
    return index;
  }, [adjustedTime, lyrics, synced]);

  // `timeupdate` only fires a few times a second, so the highlight is
  // interpolated between reports and written straight to the DOM. Re-rendering
  // the whole lyric list every frame would be far more expensive.
  const anchorRef = useRef({ time: adjustedTime, at: 0 });
  anchorRef.current = { time: adjustedTime, at: performance.now() };

  useEffect(() => {
    if (!synced || activeIndex < 0) return;
    const line = lyrics[activeIndex];
    const next = lyrics[activeIndex + 1];
    const span = fillRef.current;
    if (!span) return;

    const paint = (time: number) => {
      const ratio =
        !next || next.time <= line.time
          ? 1
          : Math.min(1, Math.max(0, (time - line.time) / (next.time - line.time)));
      span.style.setProperty('--fill', `${ratio * 100}%`);
    };

    if (!isPlaying) {
      paint(anchorRef.current.time);
      return;
    }

    let frame = 0;
    const tick = () => {
      const { time, at } = anchorRef.current;
      paint(time + (performance.now() - at) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, isPlaying, lyrics, synced]);

  // Scroll the active line into view.
  useEffect(() => {
    if (!synced || activeIndex < 0) return;
    const lines = containerRef.current?.querySelectorAll('.lyrics');
    lines?.[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex, synced]);

  // Count-in before a line that follows a long instrumental stretch.
  const countIn = useMemo(() => {
    if (!synced || !isPlaying) return 0;
    const next = lyrics[activeIndex + 1];
    if (!next) return 0;
    const previousTime = activeIndex >= 0 ? lyrics[activeIndex].time : 0;
    if (next.time - previousTime < COUNT_IN_SECONDS) return 0;
    const remaining = next.time - adjustedTime;
    if (remaining <= 0 || remaining > COUNT_IN_SECONDS) return 0;
    return Math.ceil(remaining);
  }, [activeIndex, adjustedTime, isPlaying, lyrics, synced]);

  // Tap the line being sung right now to calibrate the lyrics to the music.
  const syncToLine = (index: number) => {
    if (!synced) return;
    applyOffset(lyrics[index].time - currentTime);
    toast.success(t('karaoke.lyricsSynced'));
  };

  return (
    <div className="bg-secondary/20 rounded-lg p-4 md:p-6 border border-secondary space-y-4">
      <h2 className="text-xl font-semibold">{t('karaoke.title')}</h2>

      <VoiceControls />

      <AudioVisualizer engine={audioEngine} active={isPlaying} />

      {/* Lyrics calibration */}
      {synced && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
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
          <span className="w-12 text-center font-mono tabular-nums">
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
          <span className="basis-full text-center opacity-70">{t('karaoke.tapToSync')}</span>
        </div>
      )}

      {/* Count-in dots */}
      <div className="h-4 flex items-center justify-center gap-2" aria-hidden="true">
        {Array.from({ length: countIn }).map((_, i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full bg-upbeats-400 animate-pulse" />
        ))}
      </div>

      {/* Lyrics */}
      <div ref={containerRef} className="lyricsContainer scrollbar-hidden">
        {lyrics.map((lyric, index) => {
          const isActive = synced && activeIndex === index;
          return (
            <div
              key={index}
              onClick={() => syncToLine(index)}
              className={cn(
                'lyrics text-center transition-all',
                synced && 'cursor-pointer hover:opacity-80',
                isActive && 'active'
              )}
            >
              {isActive ? (
                <span ref={fillRef} className="lyricFill">
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
