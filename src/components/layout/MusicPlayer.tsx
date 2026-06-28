
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/context/PlayerContext';

const FALLBACK_IMG = `${import.meta.env.BASE_URL}placeholder.svg`;

const formatTime = (time: number) => {
  if (!isFinite(time) || time < 0) time = 0;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MusicPlayer: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    prev,
  } = usePlayer();

  const title = currentTrack?.title ?? t('player.selectSong');
  const artist = currentTrack?.artist ?? t('player.artistName');
  const cover = currentTrack?.coverImage || FALLBACK_IMG;
  const hasTrack = !!currentTrack;

  return (
    <div className="bg-upbeats-950 border-t border-border py-2 px-3 md:py-3 md:px-5">
      {/* Mobile layout */}
      <div className="flex md:hidden items-center gap-3">
        <img
          src={cover}
          alt={title}
          className="h-10 w-10 rounded object-cover shrink-0"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs truncate">{title}</h4>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>
        <Button
          size="icon"
          onClick={togglePlay}
          disabled={!hasTrack}
          className="rounded-full bg-white text-black hover:bg-white/90 h-8 w-8 shrink-0 disabled:opacity-40"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-4 w-48">
          <img
            src={cover}
            alt={title}
            className="h-14 w-14 rounded-md object-cover shrink-0"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
          />
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <p className="text-xs text-muted-foreground truncate">{artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center max-w-md w-full">
          <div className="flex items-center space-x-4">
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-white"
              onClick={prev}
              disabled={!hasTrack}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              onClick={togglePlay}
              disabled={!hasTrack}
              className="rounded-full bg-white text-black hover:bg-white/90 h-8 w-8 flex items-center justify-center disabled:opacity-40"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-white"
              onClick={next}
              disabled={!hasTrack}
            >
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
              onValueChange={(v) => seek(v[0])}
              disabled={!hasTrack}
            />
            <span className="text-xs text-muted-foreground ml-2">{formatTime(duration || 0)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-32">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-white"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            className="w-20"
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={(v) => setVolume(v[0])}
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
