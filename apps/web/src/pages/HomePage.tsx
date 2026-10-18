import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GameMode, type LeaderboardEntry } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { InviteModal } from '../components/common/InviteModal';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { leaderboardApi } from '../api/leaderboard';
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
import { useSocketContext } from '../providers/SocketProvider';
import { friendsApi, type FriendModel } from '../api/friends';
import { UserProfileModal, type UserProfileTarget } from '../components/common/UserProfileModal';

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
  const { onlineUsers, sendChallenge } = useSocketContext();

  const [activeTab, setActiveTab] = useState<'all' | 'friends'>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'Shashka Bot',
      text: language === 'ru'
        ? "Добро пожаловать в Shashka Online! Выберите соперника или отправьте вызов другу."
        : language === 'en'
          ? "Welcome to Shashka Online! Choose an opponent or send an invite to a friend."
          : "Shashka Online ga xush kelibsiz! Ro'yxatdan raqib tanlang yoki do'stingizga taklif yuboring.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => (user?.id ? usersApi.getUserStats(user.id) : null),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  // Query online users from API as well for initial instant load
  const { data: apiOnlineUsers, isLoading: isPlayersLoading } = useQuery({
    queryKey: ['home-online-players'],
    queryFn: () => usersApi.getOnlineUsers(),
    refetchInterval: 5000,
  });

  // Query friends list
  const { data: friendsList, isLoading: isFriendsLoading } = useQuery({
    queryKey: ['friends-list'],
    queryFn: () => friendsApi.getFriends(),
    staleTime: 10000,
  });

  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfileTarget | null>(null);

  // Query top leaderboard player for marquee bar
  const { data: leaderboardData } = useQuery({
    queryKey: ['home-leaderboard-top'],
    queryFn: () => leaderboardApi.getLeaderboard(GameMode.CLASSIC, 5),
    staleTime: 60000,
  });

  const currentRating = stats?.currentRating ?? (user ? (user as any).rating ?? 0 : 0);
  const userDiamonds = wallet?.balance ?? 100;

  // Real-time active users who currently have the web app open right now!
  const onlinePlayers: OnlinePlayer[] = React.useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(apiOnlineUsers)) {
      apiOnlineUsers.forEach((u: any) => {
        if (u && u.id) map.set(u.id, u);
      });
    }
    if (Array.isArray(onlineUsers)) {
      onlineUsers.forEach((u) => {
        if (u && u.id) map.set(u.id, u);
      });
    }
    return Array.from(map.values())
      .filter((entry) => entry.id !== user?.id)
      .map((entry) => ({
        id: entry.id,
        name: entry.displayName || 'O\'yinchi',
        elo: entry.rating ?? 0,
        diamonds: 100,
        stars: Math.max(1, Math.floor((entry.rating ?? 0) / 100)),
        avatarUrl: entry.avatarUrl,
        isPremium: (entry.rating ?? 0) >= 500,
      }));
  }, [onlineUsers, apiOnlineUsers, user?.id]);

  const topMarqueeUser = leaderboardData?.topPlayers?.[0];

  const handleChallenge = (player: OnlinePlayer) => {
    triggerHaptic('medium');
    sendChallenge(player.id, player.name);
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
            💪 {topMarqueeUser ? `${topMarqueeUser.rating} ${topMarqueeUser.displayName}` : `${user?.displayName || "O'yinchi"} (1200)`} · Eng yuqori reyting
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
                  TOP MATCH
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-rose-300 font-bold">
                  <Heart className="w-3 h-3 fill-rose-400 text-rose-400" /> 12
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
              {onlinePlayers.length + (user ? 1 : 0)}
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
              {friendsList ? friendsList.length : 0}
            </span>
          </button>
        </div>

        {/* Players List or Friends Section */}
        {activeTab === 'friends' ? (
          <div className="flex flex-col gap-2 mt-1">
            {friendsList && friendsList.length > 0 ? (
              friendsList.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedProfileUser({
                        id: friend.id,
                        name: friend.displayName,
                        username: friend.username,
                        avatarUrl: friend.avatarUrl,
                        elo: friend.rating ?? 0,
                        isOnline: friend.isOnline,
                      });
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="relative">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.displayName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-base ring-2 ring-indigo-500/30">
                          {friend.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-zinc-900 flex items-center justify-center ${
                          friend.isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`}
                        title={friend.isOnline ? 'Onlayn' : 'Oflayn'}
                      >
                        {friend.isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </span>
                    </div>

                    <div className="truncate">
                      <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <span className="truncate">{friend.displayName}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[8px] font-bold shrink-0 ${
                            friend.isOnline
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {friend.isOnline ? 'Onlayn' : 'Oflayn'}
                        </span>
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="font-semibold text-zinc-300">ELO {friend.rating ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleChallenge({
                        id: friend.id,
                        name: friend.displayName,
                        elo: friend.rating ?? 0,
                        diamonds: 100,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 active:scale-95 text-white font-bold text-[11px] transition-all shadow-md shadow-indigo-950/40 shrink-0 flex items-center gap-1 ml-2"
                  >
                    <Swords className="w-3 h-3" />
                    <span>{language === 'ru' ? 'Вызов' : language === 'en' ? 'Challenge' : "O'yinga taklif"}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">
                    {language === 'ru' ? 'У вас пока нет друзей' : language === 'en' ? 'No friends yet' : "Do'stlaringiz hali yo'q"}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px]">
                    {language === 'ru'
                      ? 'Нажмите на любого игрока, чтобы добавить его в друзья, или отправьте ссылку-приглашение!'
                      : language === 'en'
                        ? 'Tap any player to add them as friend, or send an invite link!'
                        : "O'yinchilar ustiga bosib do'stlarga qo'shing yoki do'stingizga havola yuboring!"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setIsInviteOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/40 active:scale-95 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{language === 'ru' ? 'Пригласить друга' : language === 'en' ? 'Invite Friend' : "Do'stni taklif qilish"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            {/* Item 1: CURRENT USER */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900/90 to-zinc-900/90 border border-indigo-500/30 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-inner ring-2 ring-emerald-500/50">
                    {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'D'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900 flex items-center justify-center" title="Onlayn">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>{user?.displayName || "Diyorbek Abdug'afforov"}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                      Onlayn
                    </span>
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span className="font-semibold text-zinc-300">ELO {currentRating}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1 text-sky-400 font-semibold">
                      <Gem className="w-3 h-3 text-sky-400" />
                      {userDiamonds}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-xs italic text-indigo-400 font-medium pr-1">
                {language === 'ru' ? 'Это вы' : language === 'en' ? 'It is you' : 'Bu siz'}
              </span>
            </div>

            {/* SKELETON LOADING STATE */}
            {isPlayersLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2].map((n) => (
                  <div key={n} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-zinc-800" />
                      <div className="flex flex-col gap-1.5">
                        <div className="w-24 h-3 bg-zinc-800 rounded" />
                        <div className="w-16 h-2.5 bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                    <div className="w-20 h-7 bg-zinc-800 rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {/* EMPTY STATE IF NO OTHER ONLINE PLAYERS */}
            {!isPlayersLoading && onlinePlayers.length === 0 && (
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">
                    {language === 'ru' ? 'Сейчас других игроков нет онлайн' : language === 'en' ? 'No other players online right now' : "Hozircha boshqa hech kim onlayn emas"}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {language === 'ru'
                      ? 'Пригласите друга по ссылке или найдите случайного соперника!'
                      : language === 'en'
                        ? 'Invite a friend via link or search for a random match!'
                        : "Do'stingizni taklif qiling yoki tasodifiy o'yinni tanlang!"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsInviteOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/40 active:scale-95"
                  >
                    {language === 'ru' ? 'Пригласить друга' : "Do'stni taklif qilish"}
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      navigate('/matchmaking');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 active:scale-95"
                  >
                    {language === 'ru' ? 'Случайная игра' : "Tasodifiy o'yin"}
                  </button>
                </div>
              </div>
            )}

            {/* REAL ACTIVE ONLINE PLAYERS LIST ONLY */}
            {onlinePlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedProfileUser({
                      id: player.id,
                      name: player.name,
                      elo: player.elo,
                      diamonds: player.diamonds,
                      avatarUrl: player.avatarUrl,
                      isOnline: true,
                    });
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="relative">
                    {player.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/40"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-base ring-2 ring-emerald-500/40">
                        {player.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900 flex items-center justify-center" title="Onlayn">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                    {player.isPremium && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-md bg-amber-500 text-black font-black text-[7px] uppercase tracking-tighter">
                        PRO
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      <span>{player.name}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[8px]">
                        Onlayn
                      </span>
                    </h4>
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
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 active:scale-95 text-white font-bold text-[11px] transition-all shadow-md shadow-indigo-950/40 shrink-0 flex items-center gap-1"
                >
                  <Swords className="w-3 h-3" />
                  <span>{language === 'ru' ? 'Вызов' : language === 'en' ? 'Challenge' : "O'yinga taklif"}</span>
                </button>
              </div>
            ))}

            {/* Modern Bottom Invite Card */}
            <div
              onClick={() => {
                triggerHaptic('medium');
                setIsInviteOpen(true);
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/20 via-zinc-900/60 to-zinc-900/60 border border-dashed border-indigo-500/30 text-zinc-300 flex items-center justify-between cursor-pointer hover:border-indigo-500/60 transition-colors mt-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-200">
                    {language === 'ru' ? 'Пригласить друзей' : "Do'stlarni o'yinga chorlash"}
                  </h5>
                  <p className="text-[10px] text-zinc-400">
                    {language === 'ru' ? 'Отправьте ссылку в Telegram и играйте вместе' : "Havola yuboring va darhol birgalikda o'ynang"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        )}
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

      {/* User Profile & Add Friend Modal */}
      <UserProfileModal
        isOpen={Boolean(selectedProfileUser)}
        onClose={() => setSelectedProfileUser(null)}
        targetUser={selectedProfileUser}
        onChallenge={(id, name) => sendChallenge(id, name)}
      />
    </PageContainer>
  );
};
