
import React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicCardProps {
  title: string;
  artist: string;
  coverImage: string;
  className?: string;
  onClick?: () => void;
}

const MusicCard: React.FC<MusicCardProps> = ({ 
  title, 
  artist, 
  coverImage, 
  className,
  onClick 
}) => {
  return (
    <div 
      className={cn(
        "group relative bg-secondary/40 rounded-md p-4 transition-all hover:bg-secondary/70 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-square mb-4 rounded-md overflow-hidden">
        <img 
          src={coverImage} 
          alt={title} 
          className="object-cover h-full w-full transition-transform group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="h-12 w-12 rounded-full bg-upbeats-500 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <Play className="h-6 w-6 ml-1" />
          </button>
        </div>
      </div>
      <h3 className="font-medium text-white line-clamp-1">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{artist}</p>
    </div>
  );
};

export default MusicCard;
