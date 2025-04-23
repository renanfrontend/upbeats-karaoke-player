
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Lyric {
  text: string;
  time: number;
}

interface KaraokePlayerProps {
  lyrics: Lyric[];
  currentTime: number;
  isPlaying: boolean;
}

const KaraokePlayer: React.FC<KaraokePlayerProps> = ({ 
  lyrics, 
  currentTime, 
  isPlaying 
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Effect to track the active lyric based on currentTime
  useEffect(() => {
    const newActiveLyricIndex = lyrics.findIndex((lyric, index) => {
      const nextLyric = lyrics[index + 1];
      if (nextLyric) {
        return currentTime >= lyric.time && currentTime < nextLyric.time;
      }
      return currentTime >= lyric.time;
    });

    if (newActiveLyricIndex !== -1 && newActiveLyricIndex !== activeLyricIndex) {
      setActiveLyricIndex(newActiveLyricIndex);
    }
  }, [currentTime, lyrics, activeLyricIndex]);

  // Effect to scroll to active lyric
  useEffect(() => {
    if (containerRef.current && activeLyricIndex >= 0) {
      const lyricElements = containerRef.current.querySelectorAll('.lyrics');
      if (lyricElements[activeLyricIndex]) {
        lyricElements[activeLyricIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeLyricIndex]);

  // Microphone handling
  const toggleMicrophone = async () => {
    try {
      if (!micEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
        setMicEnabled(true);
        toast.success(t('karaoke.micEnabled'));
      } else {
        if (micStream) {
          micStream.getTracks().forEach(track => track.stop());
        }
        setMicStream(null);
        setMicEnabled(false);
        toast.info(t('karaoke.micDisabled'));
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error(t('karaoke.micPermissionDenied'));
    }
  };

  return (
    <div className="bg-secondary/20 rounded-lg p-6 border border-secondary">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-center">{t('karaoke.title')}</h2>
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
      
      {/* Audio Visualizer */}
      <div className="visualizer mb-6">
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
      
      {/* Lyrics Display */}
      <div ref={containerRef} className="lyricsContainer scrollbar-hidden">
        {lyrics.map((lyric, index) => (
          <div 
            key={index} 
            className={cn(
              "lyrics text-center transition-all", 
              activeLyricIndex === index && "active"
            )}
          >
            {lyric.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KaraokePlayer;
