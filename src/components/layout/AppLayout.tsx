
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-upbeats-900/80 to-upbeats-950">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
};

export default AppLayout;
