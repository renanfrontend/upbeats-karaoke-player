
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import AppLogo from '@/components/layout/AppLogo';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-upbeats-900/80 to-upbeats-950 p-4">
      <div className="mb-8">
        <AppLogo />
      </div>
      
      <div className="text-center max-w-md">
        <div className="bg-upbeats-500/20 p-6 rounded-full inline-block mb-6">
          <Music className="h-16 w-16 text-upbeats-400" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-6">Oops! This track doesn't exist</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for can't be found. Maybe the beat dropped too hard.
        </p>
        
        <Button 
          onClick={() => navigate('/')}
          size="lg"
          className="bg-upbeats-500 hover:bg-upbeats-600"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
