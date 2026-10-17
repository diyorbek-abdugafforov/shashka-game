import React, { useEffect, useState } from 'react';
import { PlayerColor } from '@shashka/shared-types';
import { Avatar } from '../ui/Avatar';
import { formatTimeLeft } from '../../utils/format';
import { Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PlayerInfoProps {
  displayName: string;
  avatarUrl?: string | null;
  rating?: number;
  color: PlayerColor;
  timeLeftMs?: number;
  isCurrentTurn: boolean;
  capturedCount?: number;
  isOnline?: boolean;
  className?: string;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  displayName,
  avatarUrl,
  rating,
  color,
  timeLeftMs,
  isCurrentTurn,
  capturedCount,
  isOnline,
  className,
}) => {
  const seconds = timeLeftMs !== undefined ? Math.max(0, Math.ceil(timeLeftMs / 1000)) : 0;
  const isWhite = color === PlayerColor.WHITE;
  const isUrgent = isCurrentTurn && timeLeftMs !== undefined && seconds <= 30;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 border',
        isCurrentTurn
          ? 'bg-zinc-850/90 border-indigo-500/50 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/30'
          : 'bg-zinc-900/40 border-zinc-800/60',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative">
          <Avatar src={avatarUrl} name={displayName} size="sm" isOnline={isOnline} />
          {/* Piece color icon badge */}
          <div
            className={cn(
              'absolute -top-1 -left-1 w-4 h-4 rounded-full border ring-1 ring-zinc-900 shadow-xs flex items-center justify-center',
              isWhite
                ? 'bg-stone-200 border-stone-300'
                : 'bg-zinc-800 border-zinc-700',
            )}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-100 truncate">{displayName}</span>
            {rating !== undefined && (
              <span className="text-[10px] text-zinc-400 font-mono font-medium">({rating})</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <span>{isWhite ? 'Oq toshlar' : 'Qora toshlar'}</span>
            {capturedCount !== undefined && capturedCount > 0 && (
              <span className="text-emerald-400 font-semibold">+{capturedCount}</span>
            )}
          </div>
        </div>
      </div>

      {/* Timer Display */}
      {timeLeftMs !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-bold transition-all',
            isUrgent
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80 animate-pulse'
              : isCurrentTurn
                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40',
          )}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{formatTimeLeft(seconds)}</span>
        </div>
      )}
    </div>
  );
};
