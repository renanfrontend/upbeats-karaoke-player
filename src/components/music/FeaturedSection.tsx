
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MusicCard from './MusicCard';
import { usePlayer } from '@/context/PlayerContext';
import type { Track } from '@/services/spotifyApi';

interface FeaturedSectionProps {
  title: string;
  items: Track[];
  onViewAll?: () => void;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({ title, items, onViewAll }) => {
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-upbeats-400 hover:text-upbeats-300 font-medium"
          >
            View All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <MusicCard
            key={item.id}
            title={item.title}
            artist={item.artist}
            coverImage={item.coverImage}
            onClick={() => playTrack(item, items)}
            action={
              <Button
                size="sm"
                variant="ghost"
                className="text-upbeats-400 hover:text-upbeats-300 h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/karaoke?trackId=${item.id}`);
                }}
              >
                <Mic2 className="h-3.5 w-3.5 mr-1" />
                Karaokê
              </Button>
            }
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
