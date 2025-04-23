
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Music2, Mic2, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppLogo from "./AppLogo";

const Sidebar: React.FC = () => {
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
            Home
          </NavLink>
          
          <NavLink 
            to="/search" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Search className="h-5 w-5" />
            Search
          </NavLink>
          
          <NavLink 
            to="/library" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Library className="h-5 w-5" />
            Your Library
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
            Karaoke Mode
          </NavLink>
          
          <NavLink 
            to="/songs" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-upbeats-900 hover:text-white ${isActive ? 'bg-upbeats-900/60 text-white' : 'text-muted-foreground'}`
            }
          >
            <Music2 className="h-5 w-5" />
            Songs
          </NavLink>
        </div>
        
        <Separator className="my-4 bg-upbeats-800/30" />
        
        <div className="space-y-2 pt-2">
          <h3 className="font-medium text-xs text-muted-foreground px-4 mb-2">Your Playlists</h3>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start flex items-center gap-3 text-sm font-normal text-muted-foreground hover:text-white hover:bg-upbeats-900">
              <Heart className="h-4 w-4" />
              Liked Songs
            </Button>
            <Button variant="ghost" className="w-full justify-start flex items-center gap-3 text-sm font-normal text-muted-foreground hover:text-white hover:bg-upbeats-900">
              <Clock className="h-4 w-4" />
              Recently Played
            </Button>
          </div>
        </div>
      </nav>
      
      <div className="p-4">
        <Button variant="outline" className="w-full border-upbeats-500 text-upbeats-400 hover:text-upbeats-300 hover:bg-upbeats-900/60">
          New Playlist
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
