import React from 'react';
import { PlayerColor, PieceType } from '@shashka/shared-types';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PieceProps {
  color: PlayerColor | string;
  type: PieceType;
  isSelected?: boolean;
  isMandatoryCapture?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Piece: React.FC<PieceProps> = ({
  color,
  type,
  isSelected = false,
  isMandatoryCapture = false,
  animated = true,
  className,
  onClick,
}) => {
  const isWhite =
    color === PlayerColor.WHITE ||
    (typeof color === 'string' && color.toUpperCase() === 'WHITE');
  const isKing = type === PieceType.KING;

  const content = (
    <div
      onClick={onClick}
      className={cn(
        'relative w-full h-full rounded-full flex items-center justify-center cursor-pointer select-none aspect-square transition-transform duration-150',
        isSelected && 'scale-105 z-20',
        isMandatoryCapture && 'mandatory-capture-pulse',
        className,
      )}
    >
      {/* 3D Piece Shell */}
      <div
        className={cn(
          'w-[84%] h-[84%] rounded-full flex items-center justify-center shadow-piece border relative transition-all duration-200',
          isWhite
            ? 'bg-gradient-to-b from-stone-100 via-stone-200 to-stone-400 border-stone-300 text-stone-800'
            : 'bg-gradient-to-b from-zinc-700 via-zinc-850 to-zinc-950 border-zinc-700 text-amber-400',
          isSelected &&
            (isWhite
              ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-zinc-900'
              : 'ring-4 ring-amber-400 ring-offset-2 ring-offset-zinc-900'),
          isMandatoryCapture && !isSelected && 'ring-2 ring-rose-500/80',
        )}
      >
        {/* Inner concentric ring indent */}
        <div
          className={cn(
            'w-[74%] h-[74%] rounded-full border flex items-center justify-center',
            isWhite
              ? 'border-stone-300/80 bg-stone-200/50'
              : 'border-zinc-700/80 bg-zinc-900/50',
          )}
        >
          {/* Inner groove */}
          <div
            className={cn(
              'w-[58%] h-[58%] rounded-full border flex items-center justify-center',
              isWhite
                ? 'border-stone-400/60 bg-stone-100/40'
                : 'border-zinc-600/60 bg-zinc-800/40',
            )}
          >
            {/* King / Damka Crown Emblem */}
            {isKing && (
              <Crown
                className={cn(
                  'w-[70%] h-[70%] drop-shadow-sm',
                  isWhite ? 'text-amber-600 fill-amber-500/80' : 'text-amber-400 fill-amber-400/90',
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="w-full h-full flex items-center justify-center"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};
