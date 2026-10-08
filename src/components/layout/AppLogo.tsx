
import React from 'react';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({ className, showText = true }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={`${import.meta.env.BASE_URL}logo.svg`}
        alt="UP! BEATS"
        width={40}
        height={40}
        className="h-10 w-10"
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
