
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularArtists, getTopTracks } from '@/services/spotifyApi';
import AppLayout from '@/components/layout/AppLayout';
import FeaturedSection from '@/components/music/FeaturedSection';
import MusicCard from '@/components/music/MusicCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
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
      <div className="relative rounded-xl overflow-hidden mb-8 p-8 bg-gradient-to-r from-upbeats-900 to-upbeats-500">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover opacity-20"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold mb-2">Welcome to UP! BEATS Karaoke</h1>
          <p className="text-lg text-gray-200 mb-6">
            Sing your heart out with our karaoke experience. Access thousands of songs and enjoy real-time lyrics display.
          </p>
          <Button 
            onClick={() => navigate('/karaoke')}
            size="lg" 
            className="bg-upbeats-500 hover:bg-upbeats-600 text-white"
          >
            <Mic2 className="mr-2 h-5 w-5" />
            Try Karaoke Mode
          </Button>
        </div>
      </div>
      
      {/* Top Artists */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Popular Artists</h2>
          <Button variant="ghost" className="text-upbeats-400 hover:text-upbeats-300">View All</Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {isLoadingArtists ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-36 w-36 rounded-full bg-secondary animate-pulse" />
                <div className="h-4 w-24 mt-4 rounded bg-secondary animate-pulse" />
              </div>
            ))
          ) : (
            artists?.map((artist) => (
              <div key={artist.id} className="flex flex-col items-center">
                <div className="rounded-full overflow-hidden h-36 w-36 mb-3">
                  <img 
                    src={artist.imageUrl} 
                    alt={artist.name} 
                    className="object-cover w-full h-full hover:scale-105 transition-transform" 
                  />
                </div>
                <h3 className="font-medium text-center">{artist.name}</h3>
              </div>
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
          title="Popular Tracks for Karaoke"
          items={tracks?.map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            coverImage: track.coverImage
          })) || []}
        />
      )}
    </AppLayout>
  );
};

export default Index;
