import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { isLoginAvailable, signInWithGoogle, signOutAccount, useAuth } from '@/services/auth';

/** Entrar com Google / conta conectada. Some quando o Firebase não está configurado. */
const AccountButton = () => {
  const { t } = useTranslation();
  const { user, ready, sync } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isLoginAvailable) return null;

  const run = async (action: () => Promise<void>, errorKey: string) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      const code = (error as { code?: string }).code ?? '';
      if (!code.includes('cancelled') && !code.includes('closed-by-user')) toast.error(t(errorKey));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        disabled={!ready || busy}
        onClick={() => void run(signInWithGoogle, 'auth.signInError')}
      >
        <LogIn className="h-4 w-4" />
        {t('auth.signIn')}
      </Button>
    );
  }

  const SyncIcon = sync === 'error' ? CloudOff : sync === 'syncing' ? RefreshCw : Cloud;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-2">
      {user.photoUrl ? (
        <img src={user.photoUrl} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-upbeats-600 text-sm font-semibold">
          {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name || user.email}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <SyncIcon className={`h-3 w-3 ${sync === 'syncing' ? 'animate-spin' : ''}`} />
          {t(`auth.sync.${sync}`)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled={busy}
        onClick={() => void run(signOutAccount, 'auth.signOutError')}
        aria-label={t('auth.signOut')}
        title={t('auth.signOut')}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AccountButton;
