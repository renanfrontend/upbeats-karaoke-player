import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTrackById, getLyricsByTrackId, getTopTracks } from '@/services/spotifyApi';
import AppLayout from '@/components/layout/AppLayout';
import KaraokePlayer from '@/components/karaoke/KaraokePlayer';
import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft, Volume2, Music, Search } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const Karaoke = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('trackId');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: track } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => getTrackById(trackId || ''),
    enabled: !!trackId
  });
  
  const { data: lyrics } = useQuery({
    queryKey: ['lyrics', trackId],
    queryFn: () => getLyricsByTrackId(trackId || ''),
    enabled: !!trackId
  });
  
  const { data: suggestedTracks } = useQuery({
    queryKey: ['topTracks'],
    queryFn: getTopTracks
  });
  
  useEffect(() => {
    const audioElement = audioRef.current;
    
    if (!audioElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.play().catch(error => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioElement.pause();
    }
  }, [isPlaying]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);
  
  const selectTrack = (newTrackId: string) => {
    navigate(`/karaoke?trackId=${newTrackId}`);
    setIsPlaying(false);
    setCurrentTime(0);
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const duration = (audioRef.current?.duration || 0) || (track?.duration || 0);

  return (
    <AppLayout>
      <Button 
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('karaoke.back')}
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {track ? (
            <>
              <div className="flex items-center p-6 bg-secondary/20 rounded-lg">
                <img 
                  src={track.coverImage} 
                  alt={track.title}
                  className="w-32 h-32 rounded-lg shadow-lg object-cover" 
                />
                <div className="ml-6">
                  <h1 className="text-3xl font-bold">{track.title}</h1>
                  <p className="text-xl text-muted-foreground">{track.artist}</p>
                  <p className="text-sm text-muted-foreground mt-1">{track.albumTitle}</p>
                  
                  <div className="flex items-center mt-4">
                    <Button 
                      onClick={handlePlayPause}
                      size="lg" 
                      className="bg-upbeats-500 hover:bg-upbeats-600"
                    >
                      {isPlaying ? (
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
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-secondary/20 rounded-lg">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-muted-foreground mr-3 w-10">
                    {formatTime(currentTime)}
                  </span>
                  <Slider 
                    value={[currentTime]} 
                    max={duration}
                    step={0.1}
                    className="flex-1"
                    onValueChange={handleSeek}
                  />
                  <span className="text-xs text-muted-foreground ml-3 w-10">
                    {formatTime(duration)}
                  </span>
                </div>
                
                <audio 
                  ref={audioRef}
                  src={track.previewUrl}
                  preload="metadata"
                />
              </div>
              
              {lyrics ? (
                <KaraokePlayer 
                  lyrics={lyrics.lines} 
                  currentTime={currentTime} 
                  isPlaying={isPlaying}
                />
              ) : (
                <div className="bg-secondary/20 rounded-lg p-6 text-center">
                  <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">{t('karaoke.noLyrics')}</h3>
                  <p className="text-muted-foreground">
                    {t('karaoke.noLyricsDesc')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 bg-secondary/20 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-4">{t('karaoke.selectSong')}</h2>
              <p className="text-muted-foreground mb-4">
                {t('common.chooseFromSuggested')}
              </p>
              <Button onClick={() => navigate('/search')} className="bg-upbeats-500 hover:bg-upbeats-600">
                <Search className="mr-2 h-5 w-5" />
                {t('karaoke.searchSongs')}
              </Button>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">{t('karaoke.suggestedSongs')}</h2>
          <div className="grid gap-4">
            {suggestedTracks?.map((suggestedTrack) => (
              <div 
                key={suggestedTrack.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  trackId === suggestedTrack.id ? 'bg-upbeats-900/60' : 'bg-secondary/20 hover:bg-secondary/40'
                }`}
                onClick={() => selectTrack(suggestedTrack.id)}
              >
                <img 
                  src={suggestedTrack.coverImage} 
                  alt={suggestedTrack.title}
                  className="w-12 h-12 rounded object-cover" 
                />
                <div className="ml-3 flex-1">
                  <h3 className="font-medium line-clamp-1">{suggestedTrack.title}</h3>
                  <p className="text-sm text-muted-foreground">{suggestedTrack.artist}</p>
                </div>
                {trackId === suggestedTrack.id && (
                  <div className="bg-upbeats-500 rounded-full p-1">
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
