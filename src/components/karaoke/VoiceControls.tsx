import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Headphones, Speaker, AudioLines, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer } from '@/context/PlayerContext';
import { MicLevelMeter } from './AudioVisualizer';

/** Presets for how much of the original lead vocal stays in the mix. */
const VOCAL_PRESETS = [
  { key: 'voiceOriginal', value: 100 },
  { key: 'voiceGuide', value: 20 },
  { key: 'voiceKaraoke', value: 0 },
] as const;

const VoiceControls: React.FC = () => {
  const { t } = useTranslation();
  const {
    vocalLevel,
    setVocalLevel,
    vocalControlAvailable,
    micEnabled,
    micVolume,
    micEcho,
    micEnvironment,
    toggleMic,
    setMicVolume,
    setMicEcho,
    setMicEnvironment,
    audioEngine,
  } = usePlayer();

  return (
    <div className="rounded-lg bg-secondary/30 p-4 space-y-5">
      {/* Original voice level */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AudioLines className="h-5 w-5 text-upbeats-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium leading-tight">{t('karaoke.voiceMix')}</p>
            <p className="text-xs text-muted-foreground">{t('karaoke.voiceMixDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {VOCAL_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              size="sm"
              variant={vocalLevel === preset.value ? 'default' : 'outline'}
              disabled={!vocalControlAvailable}
              className={cn('text-xs', vocalLevel === preset.value && 'bg-upbeats-500 hover:bg-upbeats-600')}
              onClick={() => setVocalLevel(preset.value)}
            >
              {t(`karaoke.${preset.key}`)}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('karaoke.voiceLevel')}
          </span>
          <Slider
            value={[vocalLevel]}
            max={100}
            step={5}
            disabled={!vocalControlAvailable}
            className="flex-1"
            onValueChange={(v) => setVocalLevel(v[0])}
            aria-label={t('karaoke.voiceLevel')}
          />
          <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">
            {vocalLevel}%
          </span>
        </div>

        {!vocalControlAvailable && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {t('karaoke.vocalControlUnavailable')}
          </p>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Microphone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {micEnabled ? (
              <Mic className="h-5 w-5 text-upbeats-400 shrink-0" />
            ) : (
              <MicOff className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium leading-tight">{t('karaoke.yourVoice')}</p>
              <p className="text-xs text-muted-foreground">{t('karaoke.yourVoiceDesc')}</p>
            </div>
          </div>
          <Button
            onClick={() => void toggleMic()}
            variant={micEnabled ? 'default' : 'outline'}
            size="sm"
            className={cn('shrink-0', micEnabled && 'bg-upbeats-500 hover:bg-upbeats-600')}
          >
            {micEnabled ? t('karaoke.micOn') : t('karaoke.micOff')}
          </Button>
        </div>

        {micEnabled && (
          <>
            <MicLevelMeter engine={audioEngine} active={micEnabled} />

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={micEnvironment === 'speakers' ? 'default' : 'outline'}
                className={cn('text-xs', micEnvironment === 'speakers' && 'bg-upbeats-500 hover:bg-upbeats-600')}
                onClick={() => setMicEnvironment('speakers')}
              >
                <Speaker className="h-4 w-4 mr-1.5" />
                {t('karaoke.micEnvSpeakers')}
              </Button>
              <Button
                size="sm"
                variant={micEnvironment === 'headphones' ? 'default' : 'outline'}
                className={cn('text-xs', micEnvironment === 'headphones' && 'bg-upbeats-500 hover:bg-upbeats-600')}
                onClick={() => setMicEnvironment('headphones')}
              >
                <Headphones className="h-4 w-4 mr-1.5" />
                {t('karaoke.micEnvHeadphones')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {micEnvironment === 'headphones'
                ? t('karaoke.micEnvHeadphonesTip')
                : t('karaoke.micEnvSpeakersTip')}
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap w-16">
                {t('karaoke.micVolume')}
              </span>
              <Slider
                value={[micVolume]}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(v) => setMicVolume(v[0])}
                aria-label={t('karaoke.micVolume')}
              />
              <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">
                {micVolume}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap w-16">
                {t('karaoke.micEcho')}
              </span>
              <Slider
                value={[micEcho]}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(v) => setMicEcho(v[0])}
                aria-label={t('karaoke.micEcho')}
              />
              <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">
                {micEcho}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceControls;
