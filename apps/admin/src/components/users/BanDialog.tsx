import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { usersApi, type UserListItem } from '@/api/users';
import { Ban, CheckCircle } from 'lucide-react';

interface BanDialogProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BanDialog: React.FC<BanDialogProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('permanent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isBanning = !user.isBanned;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Iltimos, sababni batafsil yozing (kamida 3 ta belgi)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isBanning) {
        let bannedUntil: string | undefined = undefined;
        if (duration !== 'permanent') {
          const days = parseInt(duration, 10);
          const date = new Date();
          date.setDate(date.getDate() + days);
          bannedUntil = date.toISOString();
        }

        await usersApi.banUser({
          userId: user.id,
          reason: reason.trim(),
          bannedUntil,
        });
      } else {
        await usersApi.unbanUser({
          userId: user.id,
          reason: reason.trim(),
        });
      }

      onSuccess();
      onClose();
      setReason('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Amalni bajarishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isBanning ? (
            <Ban className="w-5 h-5 text-rose-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          )}
          <span>
            {isBanning
              ? `Foydalanuvchini bloklash: ${user.displayName}`
              : `Blokdan chiqarish: ${user.displayName}`}
          </span>
        </div>
      }
      description={
        isBanning
          ? 'Bloklangan foydalanuvchi tizimga kira olmaydi va partiyalarda qatnasha olmaydi.'
          : 'Foydalanuvchiga barcha oʻyin huquqlari qaytariladi.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Bekor qilish
          </Button>
          <Button
            variant={isBanning ? 'danger' : 'success'}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isBanning ? 'Bloklashni tasdiqlash' : 'Blokdan chiqarish'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-lg">
            {error}
          </div>
        )}

        {isBanning && (
          <Select
            label="Bloklash muddati"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            options={[
              { value: '1', label: '1 kun (24 soat)' },
              { value: '3', label: '3 kun' },
              { value: '7', label: '7 kun (1 hafta)' },
              { value: '30', label: '30 kun (1 oy)' },
              { value: 'permanent', label: 'Doimiy (Permanent)' },
            ]}
          />
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            {isBanning ? 'Bloklash sababi (Audit uchun)' : 'Blokdan chiqarish asosi'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isBanning
                ? 'Masalan: Dasturiy taʼminot (cheating) yoki soʻkinish sababli'
                : 'Masalan: Apellyatsiya qanoatlantirildi yoki muddat tugadi'
            }
            rows={3}
            className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/80 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>
      </form>
    </Modal>
  );
};
