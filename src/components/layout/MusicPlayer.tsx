
import React, { useState, useRef, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MusicPlayerProps {
  songTitle?: string;
  artist?: string;
  coverArt?: string;
  audioSrc?: string;
  isPlaying?: boolean;
  onPlayPause?: (isPlaying: boolean) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  songTitle = "Select a song",
  artist = "Artist name",
  coverArt = "/placeholder.svg",
  audioSrc,
  isPlaying = false,
  onPlayPause = () => {},
}) => {
  const { t } = useTranslation();
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "metadata";
      audioRef.current = audio;

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('ended', () => {
        onPlayPause(false);
        setCurrentTime(0);
      });
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('ended', () => {});
        audio.pause();
      };
    }
  }, []);

  // Update audio source when changed
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
    }
  }, [audioSrc]);

  // Handle play/pause changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
            onPlayPause(false);
            toast.error(t('player.playbackError'));
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (isMuted ? 0 : volume) / 100;
    }
  }, [volume, isMuted]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePlayPause = () => {
    onPlayPause(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="h-24 bg-upbeats-950 border-t border-border py-3 px-5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img src={coverArt} alt={songTitle} className="h-14 w-14 rounded-md object-cover" />
        <div>
          <h4 className="font-medium text-sm">{songTitle}</h4>
          <p className="text-xs text-muted-foreground">{artist}</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center max-w-md w-full">
        <div className="flex items-center space-x-4">
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white">
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            onClick={handlePlayPause}
            className="rounded-full bg-white text-black hover:bg-white/90 h-8 w-8 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center w-full mt-2">
          <span className="text-xs text-muted-foreground mr-2">{formatTime(currentTime)}</span>
          <Slider
            className="flex-1"
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
          />
          <span className="text-xs text-muted-foreground ml-2">{formatTime(duration || 0)}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 w-32">
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-muted-foreground hover:text-white"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Slider
          className="w-20"
          value={[isMuted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={(value) => {
            setVolume(value[0]);
            if (value[0] > 0) setIsMuted(false);
          }}
        />
      </div>
    </div>
  );
};

export default MusicPlayer;
