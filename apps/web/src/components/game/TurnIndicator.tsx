import React from 'react';
import { PlayerColor } from '@shashka/shared-types';
import { Spinner } from '../ui/Spinner';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TurnIndicatorProps {
  currentTurn: PlayerColor;
  hasMandatoryCapture?: boolean;
  isBotThinking?: boolean;
  className?: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentTurn,
  hasMandatoryCapture = false,
  isBotThinking = false,
  className,
}) => {
  const isWhite = currentTurn === PlayerColor.WHITE;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3.5 py-2 rounded-xl border transition-colors duration-200',
        hasMandatoryCapture
          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {/* Piece color dot */}
        <div
          className={cn(
            'w-3.5 h-3.5 rounded-full border shadow-xs',
            isWhite ? 'bg-stone-100 border-stone-300' : 'bg-zinc-850 border-zinc-700',
          )}
        />

        <span className="text-xs font-semibold">
          {isBotThinking ? (
            'Bot o\'ylamoqda...'
          ) : isWhite ? (
            'Navbat: Oq toshlar'
          ) : (
            'Navbat: Qora toshlar'
          )}
        </span>
      </div>

      {isBotThinking ? (
        <Spinner size="xs" className="text-indigo-400" />
      ) : hasMandatoryCapture ? (
        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Urish majburiy!</span>
        </div>
      ) : null}
    </div>
  );
};
