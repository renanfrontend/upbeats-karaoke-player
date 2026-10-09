
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTrackById, getLyricsForTrack, getTopTracks, type Track } from '@/services/spotifyApi';
import AppLayout from '@/components/layout/AppLayout';
import KaraokePlayer from '@/components/karaoke/KaraokePlayer';
import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft, Volume2, Music, Search, Upload, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { usePlayer } from '@/context/PlayerContext';
import {
  cleanSongTitle,
  getSongFile,
  isSupported as canSaveSongs,
  listSongs,
  parseSongName,
  removeSong,
  songIdForFile,
  requestPersistence,
  saveSong,
  type SavedSong,
} from '@/services/mySongs';

const FALLBACK_IMG = `${import.meta.env.BASE_URL}placeholder.svg`;

const formatTime = (timeInSeconds: number) => {
  if (!isFinite(timeInSeconds) || timeInSeconds < 0) timeInSeconds = 0;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Build a track from a file on the listener's machine. A local file plays in
 * full (instead of a 30s preview) and is same-origin, so vocal removal always
 * works on it — handy when a streaming preview can't be processed.
 */
const trackFromSong = (song: Pick<SavedSong, 'id' | 'title' | 'artist'>, audio: Blob): Track => ({
  id: song.id,
  // Músicas salvas antes da limpeza ainda trazem "(MP3 160K)" etc. no título.
  title: cleanSongTitle(song.title),
  artist: song.artist,
  artistId: '',
  albumTitle: '',
  coverImage: FALLBACK_IMG,
  duration: 0,
  previewUrl: URL.createObjectURL(audio),
});

const Karaoke = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('trackId');

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    loadTrack,
    playTrack,
    togglePlay,
    seek,
    setVolume,
  } = usePlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localTrack, setLocalTrack] = useState<Track | null>(null);
  const localUrlRef = useRef<string | null>(null);

  const releaseLocalTrack = useCallback(() => {
    if (localUrlRef.current) {
      URL.revokeObjectURL(localUrlRef.current);
      localUrlRef.current = null;
    }
    setLocalTrack(null);
  }, []);

  useEffect(() => releaseLocalTrack, [releaseLocalTrack]);

  const { data: remoteTrack } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => getTrackById(trackId || ''),
    enabled: !!trackId && !localTrack,
  });

  const track = localTrack ?? remoteTrack;

  const { data: lyrics, isLoading: isLoadingLyrics } = useQuery({
    queryKey: ['lyrics', track?.id],
    queryFn: () => getLyricsForTrack(track as Track),
    enabled: !!track,
  });

  const { data: suggestedTracks } = useQuery({
    queryKey: ['topTracks'],
    queryFn: getTopTracks,
  });

  // Load the selected track into the global player (without auto-playing).
  useEffect(() => {
    if (track) loadTrack(track);
  }, [track, loadTrack]);

  // Notify the user when no lyrics could be found.
  useEffect(() => {
    if (track && !isLoadingLyrics && !lyrics) {
      toast.info(t('karaoke.noLyrics'));
    }
  }, [track, isLoadingLyrics, lyrics, t]);

  const isThisTrackCurrent = !!track && currentTrack?.id === track.id;
  const displayTime = isThisTrackCurrent ? currentTime : 0;
  const displayDuration = isThisTrackCurrent
    ? duration || track?.duration || 0
    : track?.duration || 0;

  const handlePlayPause = () => {
    if (!track) return;
    if (isThisTrackCurrent) togglePlay();
    else playTrack(track, localTrack ? undefined : suggestedTracks);
  };

  const [mySongs, setMySongs] = useState<SavedSong[]>([]);
  const [dragging, setDragging] = useState(false);

  const refreshSongs = useCallback(async () => {
    if (!canSaveSongs()) return;
    try {
      setMySongs(await listSongs());
    } catch {
      /* sem armazenamento disponível (ex.: aba anônima): a lista fica vazia */
    }
  }, []);

  useEffect(() => {
    void refreshSongs();
  }, [refreshSongs]);

  const playLocal = (song: Pick<SavedSong, 'id' | 'title' | 'artist'>, audio: Blob) => {
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    const next = trackFromSong(song, audio);
    localUrlRef.current = next.previewUrl ?? null;
    setLocalTrack(next);
    if (trackId) navigate('/karaoke');
    return next;
  };

  // Salva todas as músicas escolhidas (celular ou computador) e já toca a primeira.
  const addSongs = async (picked: File[]) => {
    const files = picked.filter((file) => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|opus|flac|weba|webm)$/i.test(file.name));
    if (!files.length) {
      if (picked.length) toast.error(t('karaoke.notAudio'));
      return;
    }
    const fallbackArtist = t('karaoke.localArtist');
    try {
      if (!canSaveSongs()) throw new Error('no storage');
      void requestPersistence();
      for (const file of files) await saveSong(file, fallbackArtist);
      toast.success(t('karaoke.songsSaved', { count: files.length }));
    } catch {
      toast.warning(t('karaoke.songNotSaved'));
    }
    playLocal({ id: songIdForFile(files[0]), ...parseSongName(files[0].name, fallbackArtist) }, files[0]);
    void refreshSongs();
  };

  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    void addSongs(files);
  };

  // Tocar numa música da lista já começa a tocar; tocar na que está aberta pausa/retoma.
  const playSaved = async (song: SavedSong) => {
    if (localTrack?.id === song.id) {
      playTrack(localTrack);
      return;
    }
    try {
      const blob = await getSongFile(song.id);
      if (!blob) throw new Error('missing');
      playTrack(playLocal(song, blob));
    } catch {
      toast.error(t('karaoke.songMissing'));
      void refreshSongs();
    }
  };

  const deleteSaved = async (song: SavedSong) => {
    try {
      await removeSong(song.id);
      toast.success(t('karaoke.songRemoved'));
    } finally {
      void refreshSongs();
    }
  };

  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files');

  const selectTrack = (newTrackId: string) => {
    releaseLocalTrack();
    navigate(`/karaoke?trackId=${newTrackId}`);
  };

  return (
    <AppLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFilePicked}
      />

      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('karaoke.back')}
      </Button>

      <div
        className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          setDragging(false);
          void addSongs(Array.from(e.dataTransfer.files));
        }}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-upbeats-400 bg-upbeats-950/80 text-lg font-semibold">
            <Upload className="mr-3 h-6 w-6" />
            {t('karaoke.dropHere')}
          </div>
        )}
        <div className="lg:col-span-2 space-y-6">
          {track ? (
            <>
              <div className="flex flex-col sm:flex-row items-center sm:items-start p-4 md:p-6 bg-secondary/20 rounded-lg gap-4 sm:gap-0">
                <img
                  src={track.coverImage}
                  alt={track.title}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg shadow-lg object-cover shrink-0"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                />
                <div className="sm:ml-6 text-center sm:text-left">
                  <h1 className="text-xl md:text-3xl font-bold">{track.title}</h1>
                  <p className="text-base md:text-xl text-muted-foreground">{track.artist}</p>
                  <p className="text-sm text-muted-foreground mt-1">{track.albumTitle}</p>

                  <div className="flex items-center justify-center sm:justify-start mt-4">
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="bg-upbeats-500 hover:bg-upbeats-600"
                    >
                      {isThisTrackCurrent && isPlaying ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          {t('common.pause')}
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5 ml-1" />
                          {t('common.play')}
                        </>
                      )}
                    </Button>

                    <div className="flex items-center ml-6 space-x-2">
                      <Volume2 className="h-5 w-5 text-muted-foreground" />
                      <Slider
                        value={[volume]}
                        max={100}
                        step={1}
                        className="w-24"
                        onValueChange={(value) => setVolume(value[0])}
                        aria-label={t('karaoke.musicVolume')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/20 rounded-lg">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-muted-foreground mr-3 w-10">
                    {formatTime(displayTime)}
                  </span>
                  <Slider
                    value={[displayTime]}
                    max={displayDuration || 100}
                    step={0.1}
                    className="flex-1"
                    onValueChange={(value) => seek(value[0])}
                    aria-label={t('karaoke.seek')}
                  />
                  <span className="text-xs text-muted-foreground ml-3 w-10">
                    {formatTime(displayDuration)}
                  </span>
                </div>
                {!localTrack && track.previewUrl && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {t('karaoke.previewNote')}
                  </p>
                )}
              </div>

              {/* O modo karaokê (voz original e microfone) funciona com ou sem letra. */}
              <KaraokePlayer
                lyrics={lyrics?.lines ?? []}
                synced={lyrics?.synced ?? false}
                currentTime={displayTime}
                isPlaying={isThisTrackCurrent && isPlaying}
                trackId={track.id}
              />
              {!lyrics && (
                <div className="bg-secondary/20 rounded-lg p-4 text-center">
                  <Music className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <h3 className="text-base font-medium mb-1">
                    {isLoadingLyrics ? t('karaoke.loadingLyrics') : t('karaoke.noLyrics')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('karaoke.noLyricsDesc')}</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 bg-secondary/20 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-4">{t('karaoke.selectSong')}</h2>
              <p className="text-muted-foreground mb-4">{t('common.chooseFromSuggested')}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => navigate('/search')} className="bg-upbeats-500 hover:bg-upbeats-600">
                  <Search className="mr-2 h-5 w-5" />
                  {t('karaoke.searchSongs')}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-5 w-5" />
                  {t('karaoke.useMyMusic')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-5 w-5" />
              {t('karaoke.useMyMusic')}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">{t('karaoke.useMyMusicDesc')}</p>
          </div>

          <h2 className="text-xl font-semibold mb-3">{t('karaoke.mySongs')}</h2>
          {mySongs.length ? (
            <div className="grid gap-2 mb-6" data-testid="my-songs">
              {mySongs.map((song) => {
                const active = localTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center rounded-lg ${active ? 'bg-upbeats-900/60' : 'bg-secondary/20 hover:bg-secondary/40'}`}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left"
                      onClick={() => void playSaved(song)}
                    >
                      <span className="shrink-0 rounded-full bg-upbeats-500 p-2">
                        {active && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{song.title}</span>
                        <span className="block truncate text-sm text-muted-foreground">{song.artist}</span>
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void deleteSaved(song)}
                      aria-label={`${t('karaoke.removeSong')}: ${song.title}`}
                      title={t('karaoke.removeSong')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">{t('karaoke.mySongsHint')}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">{t('karaoke.mySongsEmpty')}</p>
          )}

          <h2 className="text-xl font-semibold mb-4">{t('karaoke.suggestedSongs')}</h2>
          <div className="grid gap-3">
            {suggestedTracks?.map((suggestedTrack) => (
              <div
                key={suggestedTrack.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  trackId === suggestedTrack.id && !localTrack
                    ? 'bg-upbeats-900/60'
                    : 'bg-secondary/20 hover:bg-secondary/40'
                }`}
                onClick={() => selectTrack(suggestedTrack.id)}
              >
                <img
                  src={suggestedTrack.coverImage}
                  alt={suggestedTrack.title}
                  className="w-12 h-12 rounded object-cover shrink-0"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                />
                <div className="ml-3 min-w-0 flex-1">
                  <h3 className="font-medium line-clamp-1">{suggestedTrack.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{suggestedTrack.artist}</p>
                </div>
                {trackId === suggestedTrack.id && !localTrack && (
                  <div className="bg-upbeats-500 rounded-full p-1 shrink-0">
                    <Music className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Karaoke;
