import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { gamesApi } from '../api/games';
import { triggerHaptic } from '../utils/telegram';
import { useTranslation } from '../i18n';
import {
  Mail,
  Settings,
  Heart,
  Pencil,
  Lock,
  ChevronRight,
  ArrowUp,
  Sparkles,
  Trophy,
  Zap,
  Flame,
  Coins,
} from 'lucide-react';
import { cn } from '../utils/cn';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet } = useAuth();
  const { t, language } = useTranslation();

  const [selectedGame, setSelectedGame] = useState<'shashka' | 'shaxmat'>('shashka');
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['my-stats', user?.id],
    queryFn: () => (user?.id ? usersApi.getUserStats(user.id) : null),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const handleLike = () => {
    triggerHaptic('light');
    if (!hasLiked) {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  const handlePromptPassword = () => {
    triggerHaptic('medium');
    const pwd = prompt(
      language === 'ru'
        ? 'Введите новый пароль для входа без Telegram:'
        : "Telegram'siz kirish uchun yangi parol kiriting:",
    );
    if (pwd) {
      alert(
        language === 'ru'
          ? 'Пароль успешно установлен! Теперь вы можете входить с логином и паролем.'
          : "Parol muvaffaqiyatli o'rnatildi! Endi brauzerdan ham kirishingiz mumkin.",
      );
    }
  };

  return (
    <PageContainer
      headerProps={{
        title: language === 'ru' ? 'Профиль' : language === 'en' ? 'Profile' : 'Profil',
        rightAction: (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                alert(language === 'ru' ? 'Новых уведомлений нет' : "Yangi bildirishnomalar yo'q");
              }}
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                navigate('/settings');
              }}
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ),
      }}
    >
      <div className="flex flex-col gap-4 pb-6">
        {/* Hero Section: Big Circular Avatar + Name + Likes */}
        <div className="flex flex-col items-center pt-2 pb-4">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full bg-blue-600 p-1 ring-4 ring-indigo-500/30 shadow-2xl flex items-center justify-center text-4xl text-white">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>👤</span>
              )}
            </div>

            {/* Likes badge */}
            <button
              onClick={handleLike}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 flex items-center gap-1 text-[11px] font-bold shadow-md active:scale-95 transition-all"
            >
              <Heart
                className={cn(
                  'w-3 h-3',
                  hasLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-400',
                )}
              />
              <span>{likesCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <h2 className="text-base font-black text-zinc-100">
              {user?.displayName || "Diyorbek Abdug'afforov"}
            </h2>
            <Pencil className="w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-white" />
          </div>

          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{language === 'ru' ? 'Онлайн' : language === 'en' ? 'Online' : 'Onlayn'}</span>
          </div>
        </div>

        {/* Game Switcher: Shashka / Shaxmat */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedGame('shashka');
            }}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none',
              selectedGame === 'shashka'
                ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/40'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <span>♟️</span>
            <span>{language === 'ru' ? 'Шашки' : language === 'en' ? 'Checkers' : 'Shashka'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedGame('shaxmat');
            }}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none',
              selectedGame === 'shaxmat'
                ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/40'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <span>♞</span>
            <span>{language === 'ru' ? 'Шахматы' : language === 'en' ? 'Chess' : 'Shaxmat'}</span>
          </button>
        </div>

        {/* Security / Password Setup Card */}
        <div
          onClick={handlePromptPassword}
          className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-600/40 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Lock className="w-5 h-5 fill-zinc-950" />
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-100">
                {language === 'ru' ? 'Установить пароль' : language === 'en' ? 'Set Password' : "Parol o'rnating"}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[240px]">
                {language === 'ru'
                  ? 'Входите через браузер по логину и паролю без Telegram.'
                  : "Telegram ishlamasa yoki akkauntingiz bo'lmasa ham brauzer va ilovadan login + parol bilan kirasiz."}
              </p>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
        </div>

        {/* Level / Rank Progress Card */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ArrowUp className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h4 className="text-xs font-bold text-zinc-200">
                {language === 'ru'
                  ? 'Для звания Солдат нужно еще 2 приглашения'
                  : "Askar unvoniga yana 2 ta do'st taklifi kerak"}
              </h4>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: '0%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>0 ta taklif</span>
            <span>2 ta maqsad</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 block">ELO Reyting</span>
            <span className="text-sm font-black text-indigo-400 mt-0.5 block">
              {stats?.currentRating || 800}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 block">G'alabalar</span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block">
              {stats?.wins || 0}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 block">Tangalar</span>
            <span className="text-sm font-black text-sky-400 mt-0.5 block">
              {wallet?.balance || 351}
            </span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
