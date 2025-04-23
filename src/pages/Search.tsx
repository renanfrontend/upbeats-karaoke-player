import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTracks } from '@/services/spotifyApi';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { t } = useTranslation();
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['searchTracks', debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });
  
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">{t('navigation.search')}</h1>
        
        <div className="relative max-w-2xl">
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            className="bg-secondary/50 border-secondary text-white pl-10 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        </div>
      </div>
      
      {/* Search Results */}
      <div className="mt-8">
        {debouncedQuery && (
          <h2 className="text-xl font-semibold mb-4">
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
            {searchResults.map((track) => (
              <div 
                key={track.id} 
                className="bg-secondary/20 p-4 rounded-md flex items-center hover:bg-secondary/40 transition-colors cursor-pointer"
              >
                <img 
                  src={track.coverImage} 
                  alt={track.title} 
                  className="h-12 w-12 rounded-md object-cover mr-4" 
                />
                <div>
                  <h3 className="font-medium">{track.title}</h3>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </div>
                <div className="ml-auto">
                  <Button size="sm" variant="ghost" className="text-upbeats-400 hover:text-upbeats-300">
                    Play
                  </Button>
                </div>
              </div>
            ))}
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
