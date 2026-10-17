import React, { useState } from 'react';
import { Flag, Handshake, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/telegram';
import { cn } from '../../utils/cn';

export interface GameControlsProps {
  onResign?: () => void;
  onOfferDraw?: () => void;
  onRotateBoard?: () => void;
  onResetGame?: () => void;
  isOnline?: boolean;
  drawOfferedByOpponent?: boolean;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  className?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onResign,
  onOfferDraw,
  onRotateBoard,
  onResetGame,
  isOnline = false,
  drawOfferedByOpponent = false,
  onAcceptDraw,
  onDeclineDraw,
  className,
}) => {
  const [showResignModal, setShowResignModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const { soundEnabled, toggleSound } = useSettingsStore();

  const handleResignConfirm = () => {
    setShowResignModal(false);
    onResign?.();
  };

  const handleDrawConfirm = () => {
    setShowDrawModal(false);
    onOfferDraw?.();
  };

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {/* If opponent offered a draw */}
      {drawOfferedByOpponent && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 animate-slide-down">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold">Raqib durang taklif qildi!</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                triggerHaptic('success');
                onAcceptDraw?.();
              }}
            >
              Qabul qilish
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                triggerHaptic('light');
                onDeclineDraw?.();
              }}
            >
              Rad etish
            </Button>
          </div>
        </div>
      )}

      {/* Main control action buttons */}
      <div className="flex items-center justify-between gap-2">
        {onRotateBoard && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              triggerHaptic('light');
              onRotateBoard();
            }}
            title="Doskani aylantirish"
            className="flex-1"
          >
            Aylantirish
          </Button>
        )}

        {onOfferDraw && !drawOfferedByOpponent && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              triggerHaptic('light');
              setShowDrawModal(true);
            }}
            leftIcon={<Handshake className="w-4 h-4" />}
            className="flex-1"
          >
            Durang
          </Button>
        )}

        {onResign && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              triggerHaptic('warning');
              setShowResignModal(true);
            }}
            leftIcon={<Flag className="w-4 h-4 text-rose-400" />}
            className="flex-1 text-rose-300 border-rose-900/40 hover:bg-rose-950/30"
          >
            Taslim
          </Button>
        )}

        {onResetGame && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              triggerHaptic('light');
              onResetGame();
            }}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="flex-1"
          >
            Qayta
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Ovozni o\'chirish' : 'Ovozni yoqish'}
          className="px-2.5 min-w-[40px]"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-zinc-300" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
        </Button>
      </div>

      {/* Resign confirmation modal */}
      <Modal
        isOpen={showResignModal}
        onClose={() => setShowResignModal(false)}
        title="O'yinni taslim qilmoqchimisiz?"
      >
        <p className="text-xs text-zinc-400">
          Taslim bo'lsangiz, raqibingiz g'alaba qozonadi va sizga mag'lubiyat yoziladi.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setShowResignModal(false)}>
            Bekor qilish
          </Button>
          <Button variant="danger" size="sm" onClick={handleResignConfirm}>
            Taslim bo'lish
          </Button>
        </div>
      </Modal>

      {/* Draw confirmation modal */}
      <Modal
        isOpen={showDrawModal}
        onClose={() => setShowDrawModal(false)}
        title="Durang taklif qilinsinmi?"
      >
        <p className="text-xs text-zinc-400">
          Raqibingizga o'zaro durang qilish taklifi yuboriladi.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDrawModal(false)}>
            Bekor qilish
          </Button>
          <Button variant="primary" size="sm" onClick={handleDrawConfirm}>
            Taklif qilish
          </Button>
        </div>
      </Modal>
    </div>
  );
};
