import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleLike, useLibrary } from '@/services/library';
import type { Track } from '@/services/spotifyApi';

/** Coração de curtir: a faixa entra (ou sai) de "Músicas curtidas". */
const LikeButton = ({ track, className }: { track: Track; className?: string }) => {
  const { t } = useTranslation();
  const liked = useLibrary().liked.some((item) => item.id === track.id);
  const label = liked ? t('library.unlike') : t('library.like');

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('shrink-0', className)}
      onClick={(event) => {
        event.stopPropagation();
        toggleLike(track);
      }}
      aria-pressed={liked}
      aria-label={`${label}: ${track.title}`}
      title={label}
    >
      <Heart className={cn('h-5 w-5', liked ? 'fill-upbeats-500 text-upbeats-500' : 'text-muted-foreground')} />
    </Button>
  );
};

export default LikeButton;
