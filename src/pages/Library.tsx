import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Music2, Play, HardDrive } from 'lucide-react';
import LikeButton from '@/components/music/LikeButton';
import { useLibrary, type LibraryTrack } from '@/services/library';
import type { Track } from '@/services/spotifyApi';

const FALLBACK_IMG = `${import.meta.env.BASE_URL}placeholder.svg`;

const asTrack = (item: LibraryTrack): Track => ({
  id: item.id,
  title: item.title,
  artist: item.artist,
  artistId: '',
  albumTitle: item.albumTitle,
  coverImage: item.coverImage || FALLBACK_IMG,
  duration: 0,
});

const Library = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { liked, recent } = useLibrary();

  // Abre a música no modo karaokê: as da busca pelo id do iTunes, as do aparelho pela lista "Minhas músicas".
  const open = (item: LibraryTrack) => {
    navigate(item.local ? `/karaoke?local=${encodeURIComponent(item.id)}` : `/karaoke?trackId=${encodeURIComponent(item.id)}`);
  };

  const renderSongList = (songs: LibraryTrack[], empty: string) =>
    songs.length ? (
      <div className="grid gap-2">
        {songs.map((song) => (
          <div
            key={song.id}
            className="flex items-center p-3 hover:bg-secondary/40 rounded-md transition-colors cursor-pointer group"
            onClick={() => open(song)}
          >
            <div className="relative h-12 w-12 shrink-0">
              <img
                src={song.coverImage || FALLBACK_IMG}
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
              <p className="text-sm text-muted-foreground truncate">
                {song.local && <HardDrive className="inline h-3.5 w-3.5 mr-1 -mt-0.5" aria-label={t('library.localSong')} />}
                {song.artist}
              </p>
            </div>
            {song.albumTitle && <div className="text-muted-foreground text-sm mr-4 hidden md:block truncate max-w-[30%]">{song.albumTitle}</div>}
            <LikeButton track={asTrack(song)} />
          </div>
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground text-sm py-8 text-center">{empty}</p>
    );

  const header = (title: string, songs: LibraryTrack[]) => (
    <div className="flex justify-between items-center mb-4 gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{t('library.songsCount', { count: songs.length })}</p>
      </div>
      {songs.length > 0 && (
        <Button className="bg-upbeats-500 hover:bg-upbeats-600" onClick={() => open(songs[0])}>
          <Play className="h-4 w-4 mr-2" /> {t('library.playAll')}
        </Button>
      )}
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
          {header(t('library.likedSongs'), liked)}
          {renderSongList(liked, t('library.emptyLiked'))}
        </TabsContent>

        <TabsContent value="recent" className="bg-secondary/20 rounded-lg p-4">
          {header(t('library.recentlyPlayed'), recent)}
          {renderSongList(recent, t('library.emptyRecent'))}
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
