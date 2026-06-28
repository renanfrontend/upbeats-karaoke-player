
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularArtists, getTopTracks } from '@/services/spotifyApi';
import AppLayout from '@/components/layout/AppLayout';
import FeaturedSection from '@/components/music/FeaturedSection';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ['popularArtists'],
    queryFn: getPopularArtists
  });

  const { data: tracks, isLoading: isLoadingTracks } = useQuery({
    queryKey: ['topTracks'],
    queryFn: getTopTracks
  });

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden mb-6 md:mb-8 p-5 md:p-8 bg-gradient-to-r from-upbeats-900 to-upbeats-500">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">{t('home.welcome')}</h1>
          <p className="text-sm md:text-lg text-gray-200 mb-4 md:mb-6">
            {t('home.description')}
          </p>
          <Button 
            onClick={() => navigate('/karaoke')}
            size="lg" 
            className="bg-upbeats-500 hover:bg-upbeats-600 text-white"
          >
            <Mic2 className="mr-2 h-5 w-5" />
            {t('home.tryKaraoke')}
          </Button>
        </div>
      </div>
      
      {/* Top Artists */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{t('home.popularArtists')}</h2>
          <Button variant="ghost" className="text-upbeats-400 hover:text-upbeats-300">
            {t('home.viewAll')}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
          {isLoadingArtists ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-20 w-20 md:h-36 md:w-36 rounded-full bg-secondary animate-pulse" />
                <div className="h-4 w-16 md:w-24 mt-3 rounded bg-secondary animate-pulse" />
              </div>
            ))
          ) : (
            artists?.map((artist) => (
              <button
                key={artist.id}
                onClick={() => navigate(`/search?q=${encodeURIComponent(artist.name)}`)}
                className="flex flex-col items-center group focus:outline-none"
              >
                <div className="rounded-full overflow-hidden h-20 w-20 md:h-36 md:w-36 mb-2 md:mb-3 bg-secondary">
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    onError={(e) => { e.currentTarget.src = `${import.meta.env.BASE_URL}placeholder.svg`; }}
                  />
                </div>
                <h3 className="font-medium text-center text-xs md:text-base group-hover:text-upbeats-300 transition-colors">{artist.name}</h3>
              </button>
            ))
          )}
        </div>
      </section>
      
      <Separator className="my-8 bg-upbeats-800/30" />
      
      {/* Featured Tracks */}
      {isLoadingTracks ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-secondary/40 rounded-md p-4">
              <div className="aspect-square rounded-md bg-muted animate-pulse mb-4" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <FeaturedSection
          title={t('home.popularTracks')}
          items={tracks || []}
          onViewAll={() => navigate('/search')}
        />
      )}
    </AppLayout>
  );
};

export default Index;
