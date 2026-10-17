import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameMode } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { formatTimeLeft, getGameModeLabel } from '../utils/format';
import { Globe2, Search, X, Shield, Swords } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export const MatchmakingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const modeParam = (searchParams.get('mode') as GameMode) || GameMode.BLITZ;
  const isRatedParam = searchParams.get('rated') !== 'false';

  const { isInQueue, queuePosition, elapsedSeconds, startSearching, cancelSearching } =
    useMatchmaking(modeParam);

  useEffect(() => {
    startSearching(modeParam, isRatedParam);

    return () => {
      cancelSearching();
    };
  }, [modeParam, isRatedParam]);

  const handleCancel = () => {
    triggerHaptic('light');
    cancelSearching();
    navigate('/modes');
  };

  return (
    <PageContainer
      headerProps={{
        title: 'Raqib izlanmoqda',
        showBack: true,
        onBack: handleCancel,
      }}
      showBottomNav={false}
    >
      <div className="flex-1 flex flex-col items-center justify-between py-6">
        {/* Match Settings Header Card */}
        <Card className="w-full p-4 bg-zinc-900/60 border-zinc-800 text-center">
          <span className="text-xs text-zinc-400">Tanlangan rejim:</span>
          <h2 className="text-base font-bold text-zinc-100 mt-0.5">
            {getGameModeLabel(modeParam)}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800/50">
              <Shield className="w-3 h-3" />
              {isRatedParam ? 'Reytingli bahs' : 'Do\'stona bahs'}
            </span>
          </div>
        </Card>

        {/* Searching Animation Radar */}
        <div className="relative flex items-center justify-center my-12">
          {/* Pulsing rings */}
          <div className="absolute w-56 h-56 rounded-full border border-indigo-500/20 animate-ping opacity-30" />
          <div className="absolute w-44 h-44 rounded-full border border-indigo-500/30 animate-pulse" />
          <div className="absolute w-32 h-32 rounded-full bg-indigo-600/10 border border-indigo-500/40" />

          {/* Central Globe Icon */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-700 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/40 text-white animate-bounce-subtle">
            <Swords className="w-9 h-9" />
          </div>
        </div>

        {/* Status Text & Timer */}
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-lg font-bold text-zinc-100">
            Mos keluvchi raqib qidirilmoqda...
          </h3>
          <p className="text-xs text-zinc-400">
            Reytingingizga mos shashkachi bilan ulanmoqda
          </p>

          <div className="inline-block mt-3 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 font-mono text-sm font-bold text-indigo-300">
            {formatTimeLeft(elapsedSeconds)}
          </div>

          {queuePosition && (
            <p className="text-[11px] text-zinc-500 mt-1">
              Navbatdagi o'rningiz: #{queuePosition}
            </p>
          )}
        </div>

        {/* Cancel Button */}
        <div className="w-full">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleCancel}
            leftIcon={<X className="w-5 h-5 text-zinc-400" />}
          >
            Qidiruvni to'xtatish
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
