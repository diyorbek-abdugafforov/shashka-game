import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GameMode } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { InviteModal } from '../components/common/InviteModal';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { gamesApi } from '../api/games';
import { triggerHaptic } from '../utils/telegram';
import { useTranslation } from '../i18n';
import {
  Users,
  Shuffle,
  Play,
  Settings,
  Crown,
  Heart,
  Globe,
  Sparkles,
  MessageSquare,
  Trophy,
  Star,
  Gem,
  Swords,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface OnlinePlayer {
  id: string;
  name: string;
  elo: number;
  diamonds: number;
  stars?: number;
  avatarUrl?: string | null;
  isPremium?: boolean;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet } = useAuth();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<'all' | 'friends'>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Shashka Bot', text: "Xush kelibsiz! Raqiblarni tanlang va o'yinga chorlang.", time: '18:00' },
    { sender: 'Жалолиддин', text: "Kim klassik shashka o'ynaydi? Taklif tashlang!", time: '18:02' },
  ]);

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => (user?.id ? usersApi.getUserStats(user.id) : null),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const currentRating = stats?.currentRating ?? 800;
  const userDiamonds = wallet?.balance ?? 351;

  // Online Players Pool
  const onlinePlayers: OnlinePlayer[] = [
    {
      id: 'p1',
      name: 'Жалолиддин Ахмадалиев 🥊',
      elo: 1923,
      diamonds: 61619,
      stars: 9,
    },
    {
      id: 'p2',
      name: '😎😎😎😎😎😎😎',
      elo: 1923,
      diamonds: 335,
    },
    {
      id: 'p3',
      name: 'BARCA 💪💪💪💪',
      elo: 1723,
      diamonds: 782,
      stars: 7,
      isPremium: true,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
    },
    {
      id: 'p4',
      name: 'Sherzodbek (Samarqand)',
      elo: 1640,
      diamonds: 450,
      stars: 3,
    },
    {
      id: 'p5',
      name: 'Shohjahon Masters',
      elo: 2100,
      diamonds: 1420,
      stars: 12,
      isPremium: true,
    },
  ];

  const handleChallenge = (player: OnlinePlayer) => {
    triggerHaptic('medium');
    setIsInviteOpen(true);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    triggerHaptic('light');
    setChatMessages((prev) => [
      ...prev,
      {
        sender: user?.displayName || 'Siz',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  return (
    <PageContainer
      headerProps={{
        title: 'Shashka Online',
        showBalance: true,
      }}
    >
      <div className="flex flex-col gap-3.5 pb-6">
        {/* Top Marquee Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs overflow-hidden">
          <span className="font-bold text-amber-400 shrink-0 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> 1-o'rin (ELO)
          </span>
          <span className="text-zinc-500">·</span>
          <div className="flex-1 truncate text-zinc-300 font-medium">
            💪 1972 Акбаров Ҳаса... Eng ko'p g'alaba
          </div>
        </div>

        {/* 2 Top Action Cards: Do'st bilan o'ynash & Haftaning eng chiroyli o'yini */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Do'st bilan o'ynash */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              setIsInviteOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#f43f5e] via-[#e11d48] to-[#9333ea] shadow-lg shadow-rose-950/30 text-white cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-white" />
            </div>

            <div>
              <h3 className="text-xs font-bold leading-tight">
                {language === 'ru' ? 'Игра с другом' : language === 'en' ? 'Play with friend' : "Do'st bilan o'ynash"}
              </h3>
              <p className="text-[10px] text-white/80 mt-1 leading-snug">
                {language === 'ru'
                  ? 'Отправьте ссылку — друг перейдет и игра начнется'
                  : language === 'en'
                    ? 'Send invite link — tap to begin match'
                    : "Havola yuboring — do'stingiz bossa, o'yin boshlanadi"}
              </p>
            </div>
          </div>

          {/* Card 2: Haftaning eng chiroyli o'yini */}
          <div
            onClick={() => {
              triggerHaptic('light');
              navigate('/history');
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#4338ca] via-[#6366f1] to-[#3b0764] shadow-lg shadow-indigo-950/30 text-white cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
              <Crown className="w-4 h-4 text-amber-300" />
            </div>

            <div>
              <h3 className="text-xs font-bold leading-tight">
                {language === 'ru' ? 'Лучшая игра недели' : language === 'en' ? 'Game of the week' : 'Haftaning eng chiroyli o\'yini'}
              </h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black tracking-wider uppercase">
                  NAVOIY
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-rose-300 font-bold">
                  <Heart className="w-3 h-3 fill-rose-400 text-rose-400" /> 35
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wide Green Banner: Tasodifiy o'yin */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] shadow-lg shadow-emerald-950/40 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Shuffle className="w-6 h-6 text-white" />
            </div>

            <div>
              <h3 className="text-sm font-black tracking-tight">
                {language === 'ru' ? 'Случайная игра' : language === 'en' ? 'Random Game' : 'Tasodifiy o\'yin'}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                {language === 'ru'
                  ? 'Игра со случайным соперником'
                  : language === 'en'
                    ? 'Play with random opponent'
                    : 'Tasodifiy o\'yinchi bilan o\'ynash'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                navigate('/matchmaking');
              }}
              className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-md active:scale-95 transition-all hover:bg-emerald-50"
              title="O'yinni boshlash"
            >
              <Play className="w-5 h-5 fill-emerald-700 ml-0.5" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                navigate('/modes');
              }}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center active:scale-95 transition-all"
              title="Sozlamalar"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Online / Friends Tabs Switcher */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('all');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none',
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
            )}
          >
            <Globe className="w-4 h-4" />
            <span>
              {language === 'ru' ? 'Все онлайн' : language === 'en' ? 'All Online' : 'Barcha onlinelar'}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              99
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('friends');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none',
              activeTab === 'friends'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
            )}
          >
            <Users className="w-4 h-4" />
            <span>
              {language === 'ru' ? 'Друзья' : language === 'en' ? 'Friends' : "Do'stlar"}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              4
            </span>
          </button>
        </div>

        {/* Players List */}
        <div className="flex flex-col gap-2 mt-1">
          {/* Item 1: CURRENT USER */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-indigo-900/50 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-inner">
                {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'D'}
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-100">
                  {user?.displayName || "Diyorbek Abdug'afforov"}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                  <span className="font-semibold text-zinc-300">ELO {currentRating}?</span>
                  <span>|</span>
                  <span className="flex items-center gap-1 text-sky-400 font-semibold">
                    <Gem className="w-3 h-3 text-sky-400" />
                    {userDiamonds}
                  </span>
                </div>
              </div>
            </div>

            <span className="text-xs italic text-zinc-500 font-medium pr-1">
              {language === 'ru' ? 'Это вы' : language === 'en' ? 'It is you' : 'Bu siz'}
            </span>
          </div>

          {/* ONLINE PLAYERS LIST */}
          {onlinePlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-base">
                      👤
                    </div>
                  )}
                  {player.isPremium && (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-amber-500 text-black font-black text-[7px] uppercase tracking-tighter">
                      PRO
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-100">{player.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span className="font-semibold text-zinc-300">ELO {player.elo}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1 text-sky-400 font-semibold">
                      <Gem className="w-3 h-3 text-sky-400" />
                      {player.diamonds}
                    </span>
                    {player.stars && (
                      <>
                        <span>|</span>
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {player.stars}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleChallenge(player)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-[11px] transition-all shadow-md shadow-indigo-950/40 shrink-0"
              >
                {language === 'ru' ? 'Вызов' : language === 'en' ? 'Challenge' : "O'yinga taklif"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => {
          triggerHaptic('light');
          setShowChatModal(true);
        }}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-2xl bg-[#1e2348] border-2 border-indigo-500/40 text-indigo-300 shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:bg-indigo-900/60"
        title="Jonli muloqot"
      >
        <MessageSquare className="w-5 h-5 fill-indigo-400 text-indigo-400" />
      </button>

      {/* Live Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center p-3">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 max-h-[80vh]">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                {language === 'ru' ? 'Чат игроков' : language === 'en' ? 'Live Chat' : 'Jonli Chat'}
              </h3>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-60 pr-1">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-zinc-800/60 border border-zinc-750 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                    <span className="font-bold text-indigo-400">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="text-zinc-200">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <input
                type="text"
                placeholder={language === 'ru' ? 'Сообщение...' : 'Xabar yozing...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2 border border-zinc-700 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Friend Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </PageContainer>
  );
};
