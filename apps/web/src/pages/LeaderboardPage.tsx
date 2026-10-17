import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GameMode, type LeaderboardEntry } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { PlayerRow } from '../components/common/PlayerRow';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { leaderboardApi } from '../api/leaderboard';
import { useAuth } from '../hooks/useAuth';
import { Trophy, Medal, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { triggerHaptic } from '../utils/telegram';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CLASSIC);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leaderboard', selectedMode],
    queryFn: () => leaderboardApi.getLeaderboard(selectedMode, 50),
    staleTime: 60000,
  });

  const handleModeChange = (mode: GameMode) => {
    triggerHaptic('selection');
    setSelectedMode(mode);
  };

  const topPlayers = data?.topPlayers || [];
  const userRank = data?.userRank;

  return (
    <PageContainer
      headerProps={{
        title: 'Yetakchilar jadvali',
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Mode Tabs */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            onClick={() => handleModeChange(GameMode.CLASSIC)}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all select-none',
              selectedMode === GameMode.CLASSIC
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            Klassik
          </button>
          <button
            onClick={() => handleModeChange(GameMode.BLITZ)}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all select-none',
              selectedMode === GameMode.BLITZ
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            Blits
          </button>
          <button
            onClick={() => handleModeChange(GameMode.RAPID)}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all select-none',
              selectedMode === GameMode.RAPID
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            Rapid
          </button>
        </div>

        {/* User's position card if exists */}
        {userRank && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
              Sizning natijangiz
            </span>
            <PlayerRow player={userRank} isCurrentUser={true} />
          </div>
        )}

        {/* Top 3 Podium Highlights if we have players */}
        {!isLoading && topPlayers.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 my-1 items-end">
            {/* 2nd place */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/60 border border-slate-700/40 text-center">
              <div className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center font-bold text-xs mb-1">
                2
              </div>
              <span className="text-xs font-bold text-zinc-200 truncate w-full">
                {topPlayers[1]?.displayName}
              </span>
              <span className="text-[10px] font-mono font-semibold text-indigo-400 mt-0.5">
                {topPlayers[1]?.rating}
              </span>
            </div>

            {/* 1st place */}
            <div className="flex flex-col items-center p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-zinc-900 border border-amber-500/40 text-center scale-105 shadow-md shadow-amber-950/30">
              <Trophy className="w-7 h-7 text-amber-400 mb-1 animate-bounce-subtle" />
              <span className="text-xs font-bold text-amber-200 truncate w-full">
                {topPlayers[0]?.displayName}
              </span>
              <span className="text-xs font-mono font-extrabold text-amber-400 mt-0.5">
                {topPlayers[0]?.rating}
              </span>
            </div>

            {/* 3rd place */}
            <div className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/60 border border-amber-900/40 text-center">
              <div className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-bold text-xs mb-1">
                3
              </div>
              <span className="text-xs font-bold text-zinc-200 truncate w-full">
                {topPlayers[2]?.displayName}
              </span>
              <span className="text-[10px] font-mono font-semibold text-indigo-400 mt-0.5">
                {topPlayers[2]?.rating}
              </span>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
            Eng kuchli shashkachilar
          </span>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : isError ? (
            <ErrorState
              title="Reytingni yuklab bo'lmadi"
              message="Internet aloqasini tekshirib, qayta urinib ko'ring."
              onRetry={refetch}
            />
          ) : topPlayers.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-6 h-6 text-indigo-400" />}
              title="Hozircha o'yinchilar yo'q"
              description="Ushbu rejimda birinchi bo'lib o'yin o'tkazing va yetakchiga aylaning!"
            />
          ) : (
            topPlayers.map((player) => (
              <PlayerRow
                key={player.userId}
                player={player}
                isCurrentUser={player.userId === user?.id}
              />
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
};
