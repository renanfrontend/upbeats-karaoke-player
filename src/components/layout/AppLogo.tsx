
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { removeBackground } from '@/utils/imageProcessing';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({ className, showText = true }) => {
  const [logoUrl, setLogoUrl] = useState('/lovable-uploads/ff5efa7d-7ff2-451d-bb51-e0444e8f4675.png');

  useEffect(() => {
    const processLogo = async () => {
      try {
        const backgroundRemovedBlob = await removeBackground(logoUrl);
        const processedLogoUrl = URL.createObjectURL(backgroundRemovedBlob);
        setLogoUrl(processedLogoUrl);
      } catch (error) {
        console.error('Failed to remove background:', error);
      }
    };

    processLogo();
  }, [logoUrl]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={logoUrl} 
        alt="Up! Beats Logo" 
        className="h-10 w-auto" 
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xs font-light text-muted-foreground">Up Technology Innovations</span>
          <span className="text-lg font-bold text-gradient">UP! BEATS</span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
