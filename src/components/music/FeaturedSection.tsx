
import React from 'react';
import MusicCard from './MusicCard';

interface FeaturedSectionProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    artist: string;
    coverImage: string;
  }>;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({ title, items }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button className="text-sm text-upbeats-400 hover:text-upbeats-300 font-medium">
          View All
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MusicCard
            key={item.id}
            title={item.title}
            artist={item.artist}
            coverImage={item.coverImage}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
