import React, { useRef, useEffect } from 'react';
import type { Move as ValidatedMove } from '@shashka/game-engine';
import { cn } from '../../utils/cn';

export interface MoveHistoryProps {
  moves: ValidatedMove[];
  currentMoveIndex?: number;
  onSelectMove?: (index: number) => void;
  className?: string;
}

function formatMove(m: any): string {
  if (!m) return '';
  if (m.notation) return m.notation;
  if (!m.from || !m.to) return '';
  const from = `${String.fromCharCode(97 + m.from.col)}${8 - m.from.row}`;
  const to = `${String.fromCharCode(97 + m.to.col)}${8 - m.to.row}`;
  const sep = m.captures && m.captures.length > 0 ? ':' : '-';
  return `${from}${sep}${to}`;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end on new moves
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [moves.length]);

  if (moves.length === 0) {
    return (
      <div className={cn('text-xs text-zinc-500 italic text-center py-2', className)}>
        Hali yurishlar amalga oshirilmadi
      </div>
    );
  }

  // Group moves into pairs (White & Black)
  const movePairs: {
    moveNumber: number;
    white?: ValidatedMove;
    black?: ValidatedMove;
    whiteIdx: number;
    blackIdx?: number;
  }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
      whiteIdx: i,
      blackIdx: i + 1 < moves.length ? i + 1 : undefined,
    });
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex items-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar text-xs font-mono bg-zinc-950/50 rounded-lg border border-zinc-800/60',
        className,
      )}
    >
      {movePairs.map((pair) => (
        <div key={pair.moveNumber} className="flex items-center gap-1 shrink-0">
          <span className="text-zinc-500 font-semibold">{pair.moveNumber}.</span>

          {pair.white && (
            <button
              onClick={() => onSelectMove && onSelectMove(pair.whiteIdx)}
              className={cn(
                'px-1.5 py-0.5 rounded transition-colors',
                currentMoveIndex === pair.whiteIdx
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-zinc-200 hover:bg-zinc-800',
              )}
            >
              {formatMove(pair.white)}
            </button>
          )}

          {pair.black && (
            <button
              onClick={() => onSelectMove && pair.blackIdx !== undefined && onSelectMove(pair.blackIdx)}
              className={cn(
                'px-1.5 py-0.5 rounded transition-colors',
                currentMoveIndex === pair.blackIdx
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800',
              )}
            >
              {formatMove(pair.black)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
