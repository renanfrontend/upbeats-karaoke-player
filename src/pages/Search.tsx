import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchTracks } from '@/services/spotifyApi';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Play, Pause, Mic2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '@/context/PlayerContext';

const FALLBACK_IMG = `${import.meta.env.BASE_URL}placeholder.svg`;

const Search = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setSearchParams(searchQuery ? { q: searchQuery } : {}, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['searchTracks', debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('navigation.search')}</h1>

        <div className="relative max-w-2xl">
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            className="bg-secondary/50 border-secondary text-white pl-10 h-12 text-base md:text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        </div>
      </div>

      {/* Search Results */}
      <div className="mt-8">
        {debouncedQuery && (
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {t('search.results')} "{debouncedQuery}"
          </h2>
        )}

        {isLoading ? (
          <div className="grid gap-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-secondary/20 p-4 rounded-md flex items-center animate-pulse">
                <div className="h-12 w-12 rounded bg-muted mr-4" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-muted mb-2" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="grid gap-1">
            {searchResults.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className="bg-secondary/20 p-3 rounded-md flex items-center hover:bg-secondary/40 transition-colors cursor-pointer"
                  onClick={() => playTrack(track, searchResults)}
                >
                  <img
                    src={track.coverImage}
                    alt={track.title}
                    className="h-12 w-12 rounded-md object-cover mr-4 shrink-0"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{track.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-upbeats-400 hover:text-upbeats-300 h-9 w-9"
                      onClick={(e) => { e.stopPropagation(); playTrack(track, searchResults); }}
                    >
                      {isCurrent && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-white h-9 w-9"
                      onClick={(e) => { e.stopPropagation(); navigate(`/karaoke?trackId=${track.id}`); }}
                    >
                      <Mic2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : debouncedQuery ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>{t('search.noResults')}</p>
            <p className="text-sm mt-2">{t('search.tryDifferent')}</p>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <p>{t('search.typeToSearch')}</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {Object.keys(t('search.genres', { returnObjects: true })).map((genre) => (
                <Button
                  key={genre}
                  variant="outline"
                  className="bg-secondary/30 border-secondary hover:bg-secondary/50"
                  onClick={() => setSearchQuery(t(`search.genres.${genre}`))}
                >
                  {t(`search.genres.${genre}`)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;
