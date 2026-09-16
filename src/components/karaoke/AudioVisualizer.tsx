import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { KaraokeAudioEngine } from '@/audio/karaokeEngine';

const BAR_COUNT = 24;

interface VisualizerProps {
  engine: KaraokeAudioEngine | null;
  active: boolean;
}

/**
 * Spectrum of what is actually coming out of the speakers, read from the
 * engine's analyser. Bars are written straight to the DOM on each frame so the
 * surrounding React tree doesn't re-render 60 times a second.
 */
export const AudioVisualizer: React.FC<VisualizerProps> = ({ engine, active }) => {
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    let frame = 0;
    let idleHeights = new Array(BAR_COUNT).fill(3);

    const paint = (heights: number[]) => {
      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = barsRef.current[i];
        if (bar) bar.style.height = `${heights[i]}px`;
      }
    };

    if (!engine || !active) {
      // Settle back to a flat line instead of freezing mid-animation.
      const settle = () => {
        idleHeights = idleHeights.map((h) => Math.max(3, h * 0.85));
        paint(idleHeights);
        if (idleHeights.some((h) => h > 3.5)) frame = requestAnimationFrame(settle);
      };
      frame = requestAnimationFrame(settle);
      return () => cancelAnimationFrame(frame);
    }

    const tick = () => {
      const spectrum = engine.readMusicSpectrum(BAR_COUNT);
      idleHeights = spectrum.map((value) => 3 + value * 45);
      paint(idleHeights);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, active]);

  return (
    <div className="visualizer" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          style={{ height: '3px' }}
        />
      ))}
    </div>
  );
};

interface MeterProps {
  engine: KaraokeAudioEngine | null;
  active: boolean;
  className?: string;
}

/** Live input level, so the singer can tell the mic is actually picking up. */
export const MicLevelMeter: React.FC<MeterProps> = ({ engine, active, className }) => {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!engine || !active) {
      if (fillRef.current) fillRef.current.style.width = '0%';
      return;
    }
    let frame = 0;
    const tick = () => {
      const level = engine.readMicLevel();
      if (fillRef.current) fillRef.current.style.width = `${Math.round(level * 100)}%`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, active]);

  return (
    <div className={cn('h-1.5 rounded-full bg-secondary overflow-hidden', className)}>
      <div
        ref={fillRef}
        className="h-full bg-gradient-to-r from-upbeats-500 to-upbeats-300 transition-[width] duration-75"
        style={{ width: '0%' }}
      />
    </div>
  );
};
