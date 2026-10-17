import React from 'react';
import { GameResult, ResultReason, PlayerColor } from '@shashka/shared-types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trophy, Frown, Handshake, ArrowUpRight, ArrowDownRight, RotateCcw, Home } from 'lucide-react';
import { getResultReasonLabel, getGameResultLabel } from '../../utils/format';
import { cn } from '../../utils/cn';

export interface GameResultModalProps {
  isOpen: boolean;
  result: GameResult | null;
  reason: ResultReason | null;
  myColor?: PlayerColor | null;
  ratingChange?: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  result,
  reason,
  myColor,
  ratingChange,
  onPlayAgain,
  onExit,
}) => {
  const resultInfo = getGameResultLabel(result, myColor || undefined);
  const reasonText = getResultReasonLabel(reason);

  const getHeroIcon = () => {
    if (resultInfo.isWin) {
      return (
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10 shadow-lg shadow-emerald-500/20">
          <Trophy className="w-9 h-9" />
        </div>
      );
    }
    if (resultInfo.isLoss) {
      return (
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center ring-8 ring-rose-500/10 shadow-lg shadow-rose-500/20">
          <Frown className="w-9 h-9" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center ring-8 ring-amber-500/10 shadow-lg shadow-amber-500/20">
        <Handshake className="w-9 h-9" />
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onExit} showCloseButton={false}>
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        {/* Hero Icon */}
        <div className="mb-4 animate-bounce-subtle">{getHeroIcon()}</div>

        {/* Title */}
        <h2
          className={cn(
            'text-2xl font-black tracking-tight mb-1',
            resultInfo.isWin && 'text-emerald-400',
            resultInfo.isLoss && 'text-rose-400',
            resultInfo.isDraw && 'text-amber-400',
          )}
        >
          {resultInfo.title}
        </h2>

        {/* Reason */}
        {reasonText && <p className="text-xs text-zinc-400 mb-4">{reasonText}</p>}

        {/* Rating Change Display */}
        {ratingChange !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-bold mb-6">
            <span>Reyting o'zgarishi:</span>
            <span
              className={cn(
                'flex items-center font-mono',
                ratingChange > 0 && 'text-emerald-400',
                ratingChange < 0 && 'text-rose-400',
                ratingChange === 0 && 'text-zinc-400',
              )}
            >
              {ratingChange > 0 && <ArrowUpRight className="w-4 h-4 mr-0.5" />}
              {ratingChange < 0 && <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onPlayAgain}
            fullWidth
            leftIcon={<RotateCcw className="w-5 h-5" />}
          >
            Yana o'ynash
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onExit}
            fullWidth
            leftIcon={<Home className="w-4 h-4" />}
          >
            Asosiy sahifaga qaytish
          </Button>
        </div>
      </div>
    </Modal>
  );
};
