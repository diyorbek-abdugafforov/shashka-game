import React from 'react';
import { PlayerColor, PieceType } from '@shashka/shared-types';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSettingsStore, type PieceSkinId } from '../../stores/settings';

export interface PieceProps {
  color: PlayerColor | string;
  type: PieceType;
  isSelected?: boolean;
  isMandatoryCapture?: boolean;
  animated?: boolean;
  skin?: PieceSkinId;
  className?: string;
  onClick?: () => void;
}

export const Piece: React.FC<PieceProps> = ({
  color,
  type,
  isSelected = false,
  isMandatoryCapture = false,
  animated = true,
  skin: propSkin,
  className,
  onClick,
}) => {
  const settingsSkin = useSettingsStore((s) => s.pieceSkin);
  const skin = propSkin || settingsSkin || 'classic';

  const isWhite =
    color === PlayerColor.WHITE ||
    (typeof color === 'string' && color.toUpperCase() === 'WHITE');
  const isKing = type === PieceType.KING;

  // High contrast 3D styling based on skin
  const getSkinStyles = () => {
    switch (skin) {
      case 'piece-gold-marble':
        return isWhite
          ? {
              outer: 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 border-amber-300 ring-2 ring-amber-400/50 text-amber-900 shadow-md',
              mid: 'border-amber-300/90 bg-amber-100/70',
              inner: 'border-amber-400/80 bg-amber-50/90',
              crown: 'text-amber-600 fill-amber-500',
            }
          : {
              outer: 'bg-gradient-to-b from-amber-700 via-amber-900 to-stone-950 border-amber-500 ring-2 ring-amber-400/60 text-amber-200 shadow-md',
              mid: 'border-amber-500/80 bg-amber-950/70',
              inner: 'border-amber-400/70 bg-stone-900/90',
              crown: 'text-amber-300 fill-amber-400',
            };

      case 'piece-obsidian':
        return isWhite
          ? {
              outer: 'bg-gradient-to-b from-sky-50 via-slate-100 to-slate-200 border-sky-300 ring-2 ring-sky-400/40 text-slate-800 shadow-md',
              mid: 'border-sky-200/90 bg-slate-100/80',
              inner: 'border-sky-300/70 bg-white',
              crown: 'text-sky-600 fill-sky-500',
            }
          : {
              outer: 'bg-gradient-to-b from-slate-900 via-black to-zinc-950 border-cyan-400 ring-2 ring-cyan-500/50 text-cyan-300 shadow-md',
              mid: 'border-cyan-500/60 bg-slate-950/90',
              inner: 'border-cyan-400/50 bg-black',
              crown: 'text-cyan-300 fill-cyan-400',
            };

      case 'piece-neon':
        return isWhite
          ? {
              outer: 'bg-gradient-to-b from-cyan-300 via-cyan-400 to-teal-500 border-cyan-200 ring-2 ring-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)] text-slate-950',
              mid: 'border-cyan-100/90 bg-cyan-200/80',
              inner: 'border-cyan-200/80 bg-white/90',
              crown: 'text-teal-900 fill-teal-800',
            }
          : {
              outer: 'bg-gradient-to-b from-fuchsia-600 via-pink-700 to-rose-900 border-pink-400 ring-2 ring-fuchsia-400 shadow-[0_0_12px_rgba(236,72,153,0.6)] text-pink-100',
              mid: 'border-pink-300/80 bg-pink-950/80',
              inner: 'border-pink-400/60 bg-zinc-950/90',
              crown: 'text-amber-300 fill-amber-400',
            };

      case 'classic':
      default:
        // Classic High-Contrast:
        // White: Glowing Ivory Pearl with Polished Gold Rim
        // Dark: Deep Imperial Ruby Crimson with Rich Gold/Bronze Rim (Strikingly distinct against dark squares!)
        return isWhite
          ? {
              outer: 'bg-gradient-to-b from-white via-amber-50/90 to-amber-200/80 border-amber-300/90 ring-2 ring-amber-400/40 text-stone-850 shadow-md',
              mid: 'border-amber-200/90 bg-amber-50/70',
              inner: 'border-amber-300/70 bg-white/90',
              crown: 'text-amber-600 fill-amber-500',
            }
          : {
              outer: 'bg-gradient-to-b from-rose-600 via-rose-800 to-rose-950 border-amber-500/80 ring-2 ring-amber-500/40 text-amber-200 shadow-md',
              mid: 'border-rose-500/70 bg-rose-950/80',
              inner: 'border-amber-500/60 bg-red-950/90',
              crown: 'text-amber-300 fill-amber-400',
            };
    }
  };

  const style = getSkinStyles();

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
          'w-[86%] h-[86%] rounded-full flex items-center justify-center shadow-lg border relative transition-all duration-200',
          style.outer,
          isSelected && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-zinc-950 scale-105',
          isMandatoryCapture && !isSelected && 'ring-3 ring-rose-500',
        )}
      >
        {/* Inner concentric ring indent */}
        <div
          className={cn(
            'w-[74%] h-[74%] rounded-full border flex items-center justify-center transition-all',
            style.mid,
          )}
        >
          {/* Inner groove */}
          <div
            className={cn(
              'w-[58%] h-[58%] rounded-full border flex items-center justify-center transition-all shadow-inner',
              style.inner,
            )}
          >
            {/* King / Damka Crown Emblem */}
            {isKing && (
              <Crown
                className={cn('w-[72%] h-[72%] drop-shadow-md', style.crown)}
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
