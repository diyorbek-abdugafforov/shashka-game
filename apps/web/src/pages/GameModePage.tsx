import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Clock, Zap, Timer, Shuffle, ShieldCheck, Play } from 'lucide-react';
import { cn } from '../utils/cn';
import { triggerHaptic } from '../utils/telegram';

interface ModeOption {
  id: GameMode;
  title: string;
  subtitle: string;
  timeLabel: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}

export const GameModePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.BLITZ);
  const [isRated, setIsRated] = useState<boolean>(true);

  const modes: ModeOption[] = [
    {
      id: GameMode.BLITZ,
      title: 'Blits',
      subtitle: 'Tezkor fikrlash va harakat talab qiladigan o\'yin',
      timeLabel: '3 daqiqa + 2 soniya',
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'Ommabop',
    },
    {
      id: GameMode.CLASSIC,
      title: 'Klassik',
      subtitle: 'Standart rus shashkasi vaqti va an\'anaviy qoidalar',
      timeLabel: '5 daqiqa + 3 soniya',
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: GameMode.RAPID,
      title: 'Rapid',
      subtitle: 'Chuqur taktik kombinatsiyalarni rejalashtirish uchun',
      timeLabel: '10 daqiqa + 5 soniya',
      icon: Timer,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: GameMode.GIVEAWAY,
      title: 'Teskari shashka (Poddavki)',
      subtitle: 'Barcha toshlaringizni raqibga berib yutish o\'yini',
      timeLabel: '3 daqiqa + 2 soniya',
      icon: Shuffle,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      badge: 'Qiziqarli',
    },
  ];

  const handleStartSearch = () => {
    triggerHaptic('medium');
    navigate(`/matchmaking?mode=${selectedMode}&rated=${isRated}`);
  };

  return (
    <PageContainer
      headerProps={{
        title: 'O\'yin rejimini tanlang',
        showBack: true,
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Rated Match Toggle */}
        <Card className="p-3.5 bg-zinc-900/60 flex items-center justify-between border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100">Reytingli o'yin</div>
              <div className="text-[11px] text-zinc-400">
                Natijalar shaxsiy reytingingizga ta'sir qiladi
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setIsRated(!isRated);
            }}
            className={cn(
              'w-12 h-6.5 rounded-full transition-colors relative flex items-center px-0.5',
              isRated ? 'bg-indigo-600' : 'bg-zinc-700',
            )}
            role="switch"
            aria-checked={isRated}
          >
            <div
              className={cn(
                'w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform',
                isRated ? 'translate-x-5.5' : 'translate-x-0',
              )}
            />
          </button>
        </Card>

        {/* Mode Selection Cards */}
        <div className="flex flex-col gap-2.5">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <Card
                key={mode.id}
                hoverable
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedMode(mode.id);
                }}
                className={cn(
                  'p-4 transition-all duration-150 border-2',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5',
                        mode.color,
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100">{mode.title}</span>
                        {mode.badge && (
                          <Badge variant="indigo" size="sm">
                            {mode.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        {mode.subtitle}
                      </p>
                      <span className="text-[11px] font-mono font-medium text-indigo-400 mt-2">
                        ⏱ {mode.timeLabel}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1',
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600',
                    )}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Start Matchmaking Button */}
        <div className="mt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleStartSearch}
            leftIcon={<Play className="w-5 h-5 fill-current" />}
          >
            Raqib izlash
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
