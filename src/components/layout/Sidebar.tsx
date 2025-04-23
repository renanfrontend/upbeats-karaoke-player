
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Music2, Mic2, Heart, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppLogo from "./AppLogo";
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="h-screen w-64 bg-upbeats-950 border-r border-border flex flex-col">
      <div className="p-6">
        <AppLogo />
      </div>
      
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Home className="h-5 w-5" />
            {t('navigation.home')}
          </NavLink>
          
          <NavLink 
            to="/search" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Search className="h-5 w-5" />
            {t('navigation.search')}
          </NavLink>
          
          <NavLink 
            to="/library" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Library className="h-5 w-5" />
            {t('navigation.library')}
          </NavLink>
        </div>
        
        <Separator className="my-4 bg-upbeats-800/30" />
        
        <div className="space-y-1">
          <NavLink 
            to="/karaoke" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Mic2 className="h-5 w-5" />
            {t('navigation.karaoke')}
          </NavLink>
          
          <NavLink 
            to="/songs" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Music2 className="h-5 w-5" />
            {t('navigation.songs')}
          </NavLink>
        </div>
        
        <Separator className="my-4 bg-upbeats-800/30" />
        
        <div className="space-y-2 pt-2">
          <h3 className="font-medium text-xs text-muted-foreground px-4 mb-2">{t('navigation.playlists.title')}</h3>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start flex items-center gap-3 text-sm font-normal text-muted-foreground hover:text-white hover:bg-upbeats-900">
              <Heart className="h-4 w-4" />
              {t('navigation.playlists.liked')}
            </Button>
            <Button variant="ghost" className="w-full justify-start flex items-center gap-3 text-sm font-normal text-muted-foreground hover:text-white hover:bg-upbeats-900">
              <Clock className="h-4 w-4" />
              {t('navigation.playlists.recent')}
            </Button>
          </div>
        </div>
      </nav>
      
      <div className="p-4 space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Globe className="h-4 w-4" />
              {i18n.language === 'pt' ? 'Português' : i18n.language === 'es' ? 'Español' : 'English'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => changeLanguage('pt')}>
              Português
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('es')}>
              Español
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="w-full border-upbeats-500 text-upbeats-400 hover:text-upbeats-300 hover:bg-upbeats-900/60">
          {t('navigation.playlists.new')}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
