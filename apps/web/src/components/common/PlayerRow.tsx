import React from 'react';
import type { LeaderboardEntry } from '@shashka/shared-types';
import { Avatar } from '../ui/Avatar';
import { RatingBadge } from './RatingBadge';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PlayerRowProps {
  player: LeaderboardEntry;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  isCurrentUser = false,
  onClick,
}) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-amber-500/50">
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-300/50">
          <Medal className="w-4 h-4 text-slate-300" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-amber-600/50">
          <Medal className="w-4 h-4 text-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-mono font-medium text-xs shrink-0">
        {rank}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-3 rounded-2xl border transition-all duration-150',
        isCurrentUser
          ? 'bg-indigo-950/40 border-indigo-700/70 shadow-sm shadow-indigo-950/50 ring-1 ring-indigo-500/30'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700',
        onClick && 'cursor-pointer active:scale-[0.99]',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {getRankBadge(player.rank)}
        <Avatar src={player.avatarUrl} name={player.displayName} size="sm" />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-zinc-100 truncate">
              {player.displayName}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-1.5 py-0.2 rounded-md">
                Siz
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            {player.gamesPlayed} o'yin · {(() => {
              if (typeof player.winRate === 'number' && !isNaN(player.winRate)) {
                return player.winRate <= 1 ? Math.round(player.winRate * 100) : Math.round(player.winRate);
              }
              return player.gamesPlayed > 0 && typeof (player as any).wins === 'number'
                ? Math.round(((player as any).wins / player.gamesPlayed) * 100)
                : 0;
            })()}% g'alaba
          </span>
        </div>
      </div>

      <div className="shrink-0 pl-2">
        <RatingBadge rating={player.rating} showRankName={false} />
      </div>
    </div>
  );
};
