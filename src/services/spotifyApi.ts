
// This is a mock service to simulate Spotify API calls
// In a real app, you'd need to implement OAuth and use the actual Spotify API

import { toast } from "sonner";

// Types for our data model
export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  albumTitle: string;
  coverImage: string;
  duration: number;
  previewUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverImage: string;
  releaseYear: number;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  tracks: Track[];
}

export interface Lyrics {
  id: string;
  trackId: string;
  lines: Array<{
    text: string;
    time: number;
  }>;
}

// Mock data for development
const mockArtists: Artist[] = [
  { id: '1', name: 'Adele', imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb68f6e5892075d7f22615bd17' },
  { id: '2', name: 'The Weeknd', imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebb5f9e28219c169fd4b9e8379' },
  { id: '3', name: 'Billie Eilish', imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb7b9a2ca657bb429e3afc4f8b' },
  { id: '4', name: 'Ed Sheeran', imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb9e690225ad4445530612ccc9' },
  { id: '5', name: 'Taylor Swift', imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0' },
];

const mockTracks: Track[] = [
  { 
    id: '1', 
    title: 'Hello', 
    artist: 'Adele', 
    artistId: '1',
    albumTitle: '25',
    coverImage: 'https://i.scdn.co/image/ab67616d0000b2736a7874a8d05aaf3eddce428a',
    duration: 295,
    previewUrl: 'https://p.scdn.co/mp3-preview/0b90429fd554bad6785faa20c01f4676dab06783'
  },
  { 
    id: '2', 
    title: 'Blinding Lights', 
    artist: 'The Weeknd', 
    artistId: '2',
    albumTitle: 'After Hours',
    coverImage: 'https://i.scdn.co/image/ab67616d0000b27338cf30ffb7079c6b176edcd4',
    duration: 200,
    previewUrl: 'https://p.scdn.co/mp3-preview/8fbf01bca38da318c5bd7e31530b84a5e01fd61a'
  },
  { 
    id: '3', 
    title: 'bad guy', 
    artist: 'Billie Eilish', 
    artistId: '3',
    albumTitle: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
    coverImage: 'https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e',
    duration: 194,
    previewUrl: 'https://p.scdn.co/mp3-preview/aded12066992fedc27cb12a5583b3574324e3c5f'
  },
  { 
    id: '4', 
    title: 'Shape of You', 
    artist: 'Ed Sheeran', 
    artistId: '4',
    albumTitle: '÷ (Divide)',
    coverImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
    duration: 233,
    previewUrl: 'https://p.scdn.co/mp3-preview/00f79b004d1162abc0f5955e9ea92db0784dd3b8'
  },
  { 
    id: '5', 
    title: 'Anti-Hero', 
    artist: 'Taylor Swift', 
    artistId: '5',
    albumTitle: 'Midnights',
    coverImage: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
    duration: 200,
    previewUrl: 'https://p.scdn.co/mp3-preview/91c4e809e4ee0729bec008c1a9a8ab005ba35ab6'
  },
  { 
    id: '6', 
    title: 'Easy On Me', 
    artist: 'Adele', 
    artistId: '1',
    albumTitle: '30',
    coverImage: 'https://i.scdn.co/image/ab67616d0000b273a7a0fcfd9441d7a404a9cf73',
    duration: 224,
    previewUrl: 'https://p.scdn.co/mp3-preview/425a3f38d413fb7752c7d142f9b0f9a19889a0f8'
  },
];

const mockLyrics: Record<string, Lyrics> = {
  '1': {
    id: 'lyrics-1',
    trackId: '1',
    lines: [
      { text: 'Hello, it\'s me', time: 0 },
      { text: 'I was wondering if after all these years', time: 5 },
      { text: 'You\'d like to meet, to go over everything', time: 10 },
      { text: 'They say that time\'s supposed to heal ya', time: 15 },
      { text: 'But I ain\'t done much healing', time: 20 },
      { text: 'Hello, can you hear me?', time: 25 },
      { text: 'I\'m in California dreaming about who we used to be', time: 30 },
      { text: 'When we were younger and free', time: 35 },
      { text: 'I\'ve forgotten how it felt before the world fell at our feet', time: 40 },
    ]
  },
  '2': {
    id: 'lyrics-2',
    trackId: '2',
    lines: [
      { text: 'Yeah', time: 0 },
      { text: 'I\'ve been tryna call', time: 5 },
      { text: 'I\'ve been on my own for long enough', time: 10 },
      { text: 'Maybe you can show me how to love, maybe', time: 15 },
      { text: 'I\'m going through withdrawals', time: 20 },
      { text: 'You don\'t even have to do too much', time: 25 },
      { text: 'You can turn me on with just a touch, baby', time: 30 },
      { text: 'I look around and', time: 35 },
      { text: 'Sin City\'s cold and empty', time: 40 },
      { text: 'No one\'s around to judge me', time: 45 },
      { text: 'I can\'t see clearly when you\'re gone', time: 50 },
    ]
  }
};

// Mock API functions

export const getPopularArtists = async (): Promise<Artist[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockArtists;
};

export const getTopTracks = async (): Promise<Track[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockTracks;
};

export const getTrackById = async (trackId: string): Promise<Track | undefined> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockTracks.find(track => track.id === trackId);
};

export const getLyricsByTrackId = async (trackId: string): Promise<Lyrics | undefined> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockLyrics[trackId];
};

export const searchTracks = async (query: string): Promise<Track[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  if (!query.trim()) return [];
  
  const lowercasedQuery = query.toLowerCase();
  return mockTracks.filter(
    track => 
      track.title.toLowerCase().includes(lowercasedQuery) || 
      track.artist.toLowerCase().includes(lowercasedQuery)
  );
};

export const authenticateSpotify = async () => {
  // In a real implementation, this would redirect to Spotify auth
  toast("Spotify authentication is mocked for demo purposes");
  return true;
};
