
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Music2, Play } from 'lucide-react';

const Library = () => {
  // Mock data for library
  const likedSongs = [
    { id: '1', title: 'Hello', artist: 'Adele', album: '25', duration: '4:55', cover: 'https://i.scdn.co/image/ab67616d0000b2736a7874a8d05aaf3eddce428a' },
    { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', cover: 'https://i.scdn.co/image/ab67616d0000b27338cf30ffb7079c6b176edcd4' },
    { id: '3', title: 'bad guy', artist: 'Billie Eilish', album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?', duration: '3:14', cover: 'https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e' },
  ];
  
  const recentlyPlayed = [
    { id: '4', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', duration: '3:53', cover: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
    { id: '5', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: '3:20', cover: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5' },
    { id: '1', title: 'Hello', artist: 'Adele', album: '25', duration: '4:55', cover: 'https://i.scdn.co/image/ab67616d0000b2736a7874a8d05aaf3eddce428a' },
  ];

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-6">Your Library</h1>
      
      <Tabs defaultValue="liked">
        <TabsList className="mb-6 bg-secondary/40">
          <TabsTrigger value="liked" className="data-[state=active]:bg-upbeats-500">
            <Heart className="h-4 w-4 mr-2" />
            Liked Songs
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-upbeats-500">
            <Clock className="h-4 w-4 mr-2" />
            Recently Played
          </TabsTrigger>
          <TabsTrigger value="playlists" className="data-[state=active]:bg-upbeats-500">
            <Music2 className="h-4 w-4 mr-2" />
            Your Playlists
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="liked" className="bg-secondary/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Liked Songs</h2>
              <p className="text-muted-foreground text-sm">{likedSongs.length} songs</p>
            </div>
            <Button className="bg-upbeats-500 hover:bg-upbeats-600">
              <Play className="h-4 w-4 mr-2" /> Play All
            </Button>
          </div>
          
          <div className="grid gap-2">
            {likedSongs.map((song) => (
              <div 
                key={song.id} 
                className="flex items-center p-3 hover:bg-secondary/40 rounded-md transition-colors cursor-pointer"
              >
                <img src={song.cover} alt={song.title} className="h-12 w-12 rounded object-cover" />
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">{song.title}</h3>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                </div>
                <div className="text-muted-foreground text-sm mr-4">{song.album}</div>
                <div className="text-muted-foreground text-sm">{song.duration}</div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="bg-secondary/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Recently Played</h2>
              <p className="text-muted-foreground text-sm">{recentlyPlayed.length} songs</p>
            </div>
            <Button className="bg-upbeats-500 hover:bg-upbeats-600">
              <Play className="h-4 w-4 mr-2" /> Play All
            </Button>
          </div>
          
          <div className="grid gap-2">
            {recentlyPlayed.map((song) => (
              <div 
                key={song.id} 
                className="flex items-center p-3 hover:bg-secondary/40 rounded-md transition-colors cursor-pointer"
              >
                <img src={song.cover} alt={song.title} className="h-12 w-12 rounded object-cover" />
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">{song.title}</h3>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                </div>
                <div className="text-muted-foreground text-sm mr-4">{song.album}</div>
                <div className="text-muted-foreground text-sm">{song.duration}</div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="playlists" className="bg-secondary/20 rounded-lg p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Create Your First Playlist</h2>
            <p className="text-muted-foreground mb-6">It's easy to organize your favorite songs into playlists</p>
            <Button className="bg-upbeats-500 hover:bg-upbeats-600">Create Playlist</Button>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Library;
