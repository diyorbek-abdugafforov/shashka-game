import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Swords, UserPlus, Check, X, Trophy, Star, Gem, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { friendsApi } from '../../api/friends';
import { triggerHaptic } from '../../utils/telegram';
import { useTranslation } from '../../i18n';

export interface UserProfileTarget {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  elo: number;
  diamonds?: number;
  isOnline?: boolean;
}

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfileTarget | null;
  onChallenge?: (userId: string, userName: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onChallenge,
}) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: friendCheck, refetch: refetchFriendCheck } = useQuery({
    queryKey: ['check-friend', targetUser?.id],
    queryFn: () => (targetUser?.id ? friendsApi.checkIsFriend(targetUser.id) : null),
    enabled: Boolean(targetUser?.id && isOpen),
  });

  const isFriend = friendCheck?.isFriend ?? false;

  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => friendsApi.addFriend(friendId),
    onSuccess: () => {
      triggerHaptic('success');
      setSuccessMsg(
        language === 'ru'
          ? 'Добавлен в друзья!'
          : language === 'en'
            ? 'Added to friends!'
            : "Do'stlaringiz safiga qo'shildi!",
      );
      queryClient.invalidateQueries({ queryKey: ['friends-list'] });
      refetchFriendCheck();
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: () => {
      triggerHaptic('error');
    },
  });

  if (!targetUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="O'yinchi profili">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {/* Avatar with status ring */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl ring-4 ring-indigo-500/20 overflow-hidden">
            {targetUser.avatarUrl ? (
              <img
                src={targetUser.avatarUrl}
                alt={targetUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{targetUser.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-zinc-900 flex items-center justify-center ${
              targetUser.isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
            }`}
            title={targetUser.isOnline ? 'Onlayn' : 'Oflayn'}
          >
            {targetUser.isOnline && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </span>
        </div>

        {/* User Details */}
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center justify-center gap-1.5">
            <span>{targetUser.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                targetUser.isOnline
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {targetUser.isOnline ? 'Onlayn' : 'Oflayn'}
            </span>
          </h3>
          {targetUser.username && (
            <p className="text-xs text-indigo-400 font-mono mt-0.5">
              @{targetUser.username}
            </p>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-750 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Reyting
              </span>
              <span className="text-xs font-bold text-zinc-100">
                ELO {targetUser.elo}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-750 flex items-center justify-center gap-2">
            <Gem className="w-4 h-4 text-sky-400" />
            <div className="text-left">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Almoslar
              </span>
              <span className="text-xs font-bold text-zinc-100">
                {targetUser.diamonds || 100}
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="w-full p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full pt-1">
          {/* Challenge Button */}
          {onChallenge && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onChallenge(targetUser.id, targetUser.name);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>
                {language === 'ru'
                  ? 'Вызвать на игру'
                  : language === 'en'
                    ? 'Challenge to Game'
                    : "O'yinga taklif qilish"}
              </span>
            </button>
          )}

          {/* Add to Friends Button */}
          {isFriend ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>
                {language === 'ru'
                  ? 'В друзьях'
                  : language === 'en'
                    ? 'Already Friends'
                    : "Do'stlaringiz ro'yxatida"}
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                triggerHaptic('light');
                addFriendMutation.mutate(targetUser.id);
              }}
              disabled={addFriendMutation.isPending}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:scale-95 text-zinc-200 font-bold text-xs transition-all border border-zinc-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>
                {addFriendMutation.isPending
                  ? "Qo'shilmoqda..."
                  : language === 'ru'
                    ? 'Добавить в друзья'
                    : language === 'en'
                      ? 'Add to Friends'
                      : "Do'stlarga qo'shish"}
              </span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
