
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Music2, Play } from 'lucide-react';
import { findTrack } from '@/services/spotifyApi';
import { usePlayer } from '@/context/PlayerContext';

const FALLBACK_IMG = `${import.meta.env.BASE_URL}placeholder.svg`;

interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
}

const Library = () => {
  const { t } = useTranslation();
  const { playTrack } = usePlayer();

  const likedSongs: LibrarySong[] = [
    { id: '1', title: 'Hello', artist: 'Adele', album: '25', duration: '4:55', cover: 'https://i.scdn.co/image/ab67616d0000b2736a7874a8d05aaf3eddce428a' },
    { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', cover: 'https://i.scdn.co/image/ab67616d0000b27338cf30ffb7079c6b176edcd4' },
    { id: '3', title: 'Easy On Me', artist: 'Adele', album: '30', duration: '3:44', cover: 'https://i.scdn.co/image/ab67616d0000b273a7a0fcfd9441d7a404a9cf73' },
  ];

  const recentlyPlayed: LibrarySong[] = [
    { id: '4', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', duration: '3:53', cover: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
    { id: '5', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: '3:20', cover: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5' },
    { id: '1', title: 'Hello', artist: 'Adele', album: '25', duration: '4:55', cover: 'https://i.scdn.co/image/ab67616d0000b2736a7874a8d05aaf3eddce428a' },
  ];

  // Library rows are static metadata; resolve a real, playable track on demand.
  const handlePlay = async (song: LibrarySong) => {
    const track = await findTrack(`${song.artist} ${song.title}`);
    if (track) {
      playTrack(track);
    } else {
      toast.error(t('search.noResults'));
    }
  };

  const playFirst = (songs: LibrarySong[]) => {
    if (songs.length) handlePlay(songs[0]);
  };

  const renderSongList = (songs: LibrarySong[]) => (
    <div className="grid gap-2">
      {songs.map((song) => (
        <div
          key={`${song.id}-${song.title}`}
          className="flex items-center p-3 hover:bg-secondary/40 rounded-md transition-colors cursor-pointer group"
          onClick={() => handlePlay(song)}
        >
          <div className="relative h-12 w-12 shrink-0">
            <img
              src={song.cover}
              alt={song.title}
              className="h-12 w-12 rounded object-cover"
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
            />
            <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <h3 className="font-medium truncate">{song.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
          </div>
          <div className="text-muted-foreground text-sm mr-4 hidden md:block">{song.album}</div>
          <div className="text-muted-foreground text-sm hidden sm:block">{song.duration}</div>
        </div>
      ))}
    </div>
  );

  return (
    <AppLayout>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('library.title')}</h1>

      <Tabs defaultValue="liked">
        <TabsList className="mb-6 bg-secondary/40 flex-wrap h-auto">
          <TabsTrigger value="liked" className="data-[state=active]:bg-upbeats-500">
            <Heart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('library.likedSongs')}</span>
            <span className="sm:hidden">{t('navigation.playlists.liked')}</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-upbeats-500">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('library.recentlyPlayed')}</span>
            <span className="sm:hidden">{t('navigation.playlists.recent')}</span>
          </TabsTrigger>
          <TabsTrigger value="playlists" className="data-[state=active]:bg-upbeats-500">
            <Music2 className="h-4 w-4 mr-2" />
            {t('library.yourPlaylists')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liked" className="bg-secondary/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">{t('library.likedSongs')}</h2>
              <p className="text-muted-foreground text-sm">
                {t('library.songsCount', { count: likedSongs.length })}
              </p>
            </div>
            <Button className="bg-upbeats-500 hover:bg-upbeats-600" onClick={() => playFirst(likedSongs)}>
              <Play className="h-4 w-4 mr-2" /> {t('library.playAll')}
            </Button>
          </div>
          {renderSongList(likedSongs)}
        </TabsContent>

        <TabsContent value="recent" className="bg-secondary/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">{t('library.recentlyPlayed')}</h2>
              <p className="text-muted-foreground text-sm">
                {t('library.songsCount', { count: recentlyPlayed.length })}
              </p>
            </div>
            <Button className="bg-upbeats-500 hover:bg-upbeats-600" onClick={() => playFirst(recentlyPlayed)}>
              <Play className="h-4 w-4 mr-2" /> {t('library.playAll')}
            </Button>
          </div>
          {renderSongList(recentlyPlayed)}
        </TabsContent>

        <TabsContent value="playlists" className="bg-secondary/20 rounded-lg p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">{t('library.createPlaylist')}</h2>
            <p className="text-muted-foreground mb-6">{t('library.playlistDescription')}</p>
            <Button className="bg-upbeats-500 hover:bg-upbeats-600">
              {t('library.createButton')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Library;
