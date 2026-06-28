
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Mic2, Heart, Clock, Globe, Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const closeMobile = () => setMobileOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`;

  const sidebarContent = (
    <>
      <div className="p-6">
        <AppLogo />
      </div>

      <nav className="flex-1 px-3">
        <div className="space-y-1">
          <NavLink to="/" className={navLinkClass} onClick={closeMobile}>
            <Home className="h-5 w-5" />
            {t('navigation.home')}
          </NavLink>

          <NavLink to="/search" className={navLinkClass} onClick={closeMobile}>
            <Search className="h-5 w-5" />
            {t('navigation.search')}
          </NavLink>

          <NavLink to="/library" className={navLinkClass} onClick={closeMobile}>
            <Library className="h-5 w-5" />
            {t('navigation.library')}
          </NavLink>
        </div>

        <Separator className="my-4 bg-upbeats-800/30" />

        <div className="space-y-1">
          <NavLink to="/karaoke" className={navLinkClass} onClick={closeMobile}>
            <Mic2 className="h-5 w-5" />
            {t('navigation.karaoke')}
          </NavLink>
        </div>

        <Separator className="my-4 bg-upbeats-800/30" />

        <div className="space-y-2 pt-2">
          <h3 className="font-medium text-xs text-muted-foreground px-4 mb-2">{t('navigation.playlists.title', 'Playlists')}</h3>
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
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-upbeats-950 border-b border-border px-4 py-3 flex items-center justify-between">
        <AppLogo />
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={closeMobile} />
      )}

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-upbeats-950 border-r border-border flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" onClick={closeMobile}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-64 bg-upbeats-950 border-r border-border flex-col shrink-0">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
