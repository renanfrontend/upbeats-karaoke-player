
import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface MusicPlayerProps {
  songTitle?: string;
  artist?: string;
  coverArt?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  songTitle = "Select a song",
  artist = "Artist name",
  coverArt = "/placeholder.svg",
  isPlaying = false,
  onPlayPause = () => {},
}) => {
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

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
            onClick={onPlayPause}
            className="rounded-full bg-white text-black hover:bg-white/90 h-8 w-8 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center w-full mt-2">
          <span className="text-xs text-muted-foreground mr-2">0:00</span>
          <Slider
            className="flex-1"
            defaultValue={[0]}
            max={100}
            step={1}
          />
          <span className="text-xs text-muted-foreground ml-2">3:45</span>
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
