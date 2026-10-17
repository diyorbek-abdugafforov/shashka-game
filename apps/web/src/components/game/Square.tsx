import React from 'react';
import { cn } from '../../utils/cn';
import type { BoardThemeId } from '../../stores/settings';

export interface SquareProps {
  row: number;
  col: number;
  isDark: boolean;
  isSelected?: boolean;
  isLegalTarget?: boolean;
  isCaptureTarget?: boolean;
  isLastMove?: boolean;
  theme?: BoardThemeId;
  label?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = ({
  row,
  col,
  isDark,
  isSelected = false,
  isLegalTarget = false,
  isCaptureTarget = false,
  isLastMove = false,
  theme = 'classic',
  label,
  onClick,
  children,
}) => {
  const getSquareColor = () => {
    switch (theme) {
      case 'wood':
        return isDark ? 'bg-[#784627]' : 'bg-[#d8b898]';
      case 'emerald':
        return isDark ? 'bg-[#0f4a38]' : 'bg-[#e2f1e8]';
      case 'dark':
        return isDark ? 'bg-[#182030]' : 'bg-[#3b475e]';
      case 'board-royal':
        return isDark ? 'bg-[#5c3317]' : 'bg-[#d2b48c]';
      case 'board-emerald-luxury':
        return isDark ? 'bg-[#0a4332]' : 'bg-[#e0f2e9]';
      case 'board-midnight':
        return isDark ? 'bg-[#0b1120]' : 'bg-[#334155]';
      case 'classic':
      default:
        return isDark ? 'bg-[#6b472e]' : 'bg-[#dfcead]';
    }
  };

  return (
    <div
      onClick={onClick}
      data-row={row}
      data-col={col}
      className={cn(
        'relative aspect-square flex items-center justify-center select-none transition-colors duration-150 overflow-hidden',
        getSquareColor(),
        isSelected && 'ring-inset ring-4 ring-amber-400 bg-amber-900/30',
        isLastMove && !isSelected && 'bg-indigo-600/30',
        isLegalTarget && 'cursor-pointer hover:brightness-110',
      )}
    >
      {/* Board coordinate notation mark */}
      {label && (
        <span
          className={cn(
            'absolute bottom-0.5 right-1 text-[9px] font-mono font-bold leading-none select-none pointer-events-none opacity-40',
            isDark ? 'text-zinc-300' : 'text-zinc-800',
          )}
        >
          {label}
        </span>
      )}

      {/* Legal Move Target Marker */}
      {isLegalTarget && !children && (
        <div
          className={cn(
            'w-4 h-4 rounded-full pointer-events-none transition-transform z-10',
            isCaptureTarget
              ? 'bg-rose-500/80 ring-4 ring-rose-500/30 scale-110'
              : 'bg-emerald-500/80 ring-4 ring-emerald-500/30',
          )}
        />
      )}

      {/* Legal Capture Indicator over piece if landing on it */}
      {isLegalTarget && isCaptureTarget && children && (
        <div className="absolute inset-0 ring-inset ring-4 ring-rose-500/80 rounded-sm z-20 pointer-events-none animate-pulse-subtle" />
      )}

      {/* Piece in square */}
      {children}
    </div>
  );
};
