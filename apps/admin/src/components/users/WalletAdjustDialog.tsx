import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { usersApi, type UserListItem } from '@/api/users';
import { Coins } from 'lucide-react';
import { formatNumber } from '@/utils/format';

interface WalletAdjustDialogProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WalletAdjustDialog: React.FC<WalletAdjustDialogProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [operation, setOperation] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [amountInput, setAmountInput] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const currentBalance = user.walletBalance || 0;
  const parsedAmount = parseInt(amountInput, 10) || 0;
  const delta = operation === 'ADD' ? parsedAmount : -parsedAmount;
  const expectedBalance = Math.max(0, currentBalance + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setError('Tanga miqdori noldan katta boʻlishi kerak');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Iltimos, oʻzgartirish sababini yozing (kamida 3 ta belgi)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await usersApi.adjustWallet({
        userId: user.id,
        amount: delta,
        reason: reason.trim(),
      });

      onSuccess();
      onClose();
      setAmountInput('');
      setReason('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Balansni oʻzgartirishda xatolik yuz berdi');
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
          <Coins className="w-5 h-5 text-amber-500" />
          <span>Hamyon balansini boshqarish</span>
        </div>
      }
      description={`${user.displayName} hisobidagi tangalarni toʻldirish yoki hisobdan chiqarish`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Bekor qilish
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            Oʻzgarishlarni saqlash
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

        {/* Current & Preview Balances */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-zinc-400 block">Joriy balans:</span>
            <span className="text-lg font-bold font-mono text-zinc-100">
              {formatNumber(currentBalance)} 🪙
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-400 block">Kutilayotgan balans:</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {formatNumber(expectedBalance)} 🪙
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Amal turi"
            value={operation}
            onChange={(e) => setOperation(e.target.value as 'ADD' | 'SUBTRACT')}
            options={[
              { value: 'ADD', label: '+ Tangalar qoʻshish' },
              { value: 'SUBTRACT', label: '- Tangalarni yechish' },
            ]}
          />

          <Input
            label="Miqdor (tanga)"
            type="number"
            min="1"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Masalan: 500"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Oʻzgartirish sababi (Audit jurnali uchun majburiy)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Masalan: Turnir gʻolibi mukofoti yoki texnik xatolik kompensatsiyasi"
            rows={3}
            className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/80 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            required
          />
        </div>
      </form>
    </Modal>
  );
};
