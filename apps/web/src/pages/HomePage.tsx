import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GameMode } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { RatingBadge } from '../components/common/RatingBadge';
import { StatCard } from '../components/common/StatCard';
import { GameCard } from '../components/common/GameCard';
import { InviteModal } from '../components/common/InviteModal';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { gamesApi } from '../api/games';
import { triggerHaptic } from '../utils/telegram';
import {
  Bot,
  Users,
  UserPlus,
  Globe2,
  Trophy,
  Zap,
  Flame,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Dices,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => (user?.id ? usersApi.getUserStats(user.id) : null),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const { data: recentGamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['my-recent-games'],
    queryFn: () => gamesApi.getMyGames({ limit: 3 }),
    staleTime: 30000,
  });

  const currentRating = stats?.currentRating ?? 1200;
  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const winRate = (() => {
    if (typeof stats?.winRate === 'number' && !isNaN(stats.winRate)) {
      return stats.winRate <= 1 ? Math.round(stats.winRate * 100) : Math.round(stats.winRate);
    }
    return gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  })();

  return (
    <PageContainer
      headerProps={{
        title: 'Rus Shashkasi',
        showBalance: true,
      }}
    >
      <div className="flex flex-col gap-5">
        {/* User Welcome Card */}
        <Card className="p-4 bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-900 border-indigo-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.avatarUrl}
                name={user?.displayName || 'Foydalanuvchi'}
                size="lg"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-400">Xush kelibsiz,</span>
                <span className="text-base font-bold text-zinc-100">
                  {user?.displayName || 'Shashkachi'}
                </span>
                <div className="mt-1">
                  <RatingBadge rating={currentRating} />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
              aria-label="Profilga o'tish"
            >
              Profil
            </Button>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {statsLoading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : (
            <>
              <StatCard
                label="O'yinlar"
                value={gamesPlayed}
                icon={<Zap className="w-3.5 h-3.5 text-indigo-400" />}
              />
              <StatCard
                label="G'alabalar"
                value={wins}
                icon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
              />
              <StatCard
                label="G'alaba %"
                value={`${winRate}%`}
                icon={<Flame className="w-3.5 h-3.5 text-rose-400" />}
              />
            </>
          )}
        </div>

        {/* Game Mode Cards */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              O'yin rejimini tanlang
            </h2>
          </div>

          {/* Online Matchmaking Primary Card */}
          <Card
            hoverable
            onClick={() => navigate('/modes')}
            className="p-5 bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-zinc-900 border-indigo-700/50 shadow-lg shadow-indigo-950/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe2 className="w-24 h-24 text-indigo-400" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Globe2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-100">Onlayn o'yin</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Tezkor
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Haqiqiy raqiblar bilan reytingli bahslar
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-300">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Card>

          {/* Invite Friend Online Card */}
          <Card
            hoverable
            onClick={() => {
              triggerHaptic('light');
              setIsInviteOpen(true);
            }}
            className="p-4 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-900 border-violet-800/40 hover:border-violet-600/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">Do'st bilan o'ynash</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-violet-950 text-violet-400 border border-violet-800">
                      Havola
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Havola orqali boshqa qurilmadagi do'stni taklif qiling
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
            </div>
          </Card>

          {/* Bot Game Card */}
          <Card
            hoverable
            onClick={() => navigate('/game/bot')}
            className="p-4 bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Botga qarshi mashg'ulot</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Oson, O'rta va Qiyin darajali sun'iy intellekt
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
            </div>
          </Card>

          {/* Offline 2-Player Pass & Play */}
          <Card
            hoverable
            onClick={() => navigate('/game/offline')}
            className="p-4 bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Ikki o'yinchi (Bir qurilmada)</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Do'stingiz bilan navbatma-navbat o'ynang
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
            </div>
          </Card>

          {/* Shop & Mini Games 2-column shortcuts */}
          <div className="grid grid-cols-2 gap-2.5">
            <Card
              hoverable
              onClick={() => {
                triggerHaptic('light');
                navigate('/shop');
              }}
              className="p-3.5 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 border-amber-800/40 hover:border-amber-600/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">Do'kon</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Doska va toshlar</p>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => {
                triggerHaptic('light');
                navigate('/mini-games');
              }}
              className="p-3.5 bg-gradient-to-br from-fuchsia-950/30 via-zinc-900 to-zinc-900 border-fuchsia-800/40 hover:border-fuchsia-600/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
                  <Dices className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">Mini o'yinlar</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Bonus & Jumboq</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Games Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              So'nggi o'yinlar
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-indigo-400 font-semibold hover:underline"
            >
              Barchasi
            </button>
          </div>

          {gamesLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentGamesData?.items && recentGamesData.items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentGamesData.items.map((game) => (
                <GameCard key={game.id} game={game} myUserId={user?.id} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-zinc-400 border-dashed border-zinc-800">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs">Siz hali birorta ham o'yin o'tkazmadingiz.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/modes')}
                className="mt-3"
              >
                Ilk o'yinni boshlash
              </Button>
            </Card>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </PageContainer>
  );
};
