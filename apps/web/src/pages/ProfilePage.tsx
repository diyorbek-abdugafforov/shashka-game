import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { RatingBadge } from '../components/common/RatingBadge';
import { StatCard } from '../components/common/StatCard';
import { GameCard } from '../components/common/GameCard';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users';
import { gamesApi } from '../api/games';
import {
  Trophy,
  Zap,
  Flame,
  Award,
  Settings as SettingsIcon,
  ShoppingBag,
  Coins,
  History,
  TrendingUp,
} from 'lucide-react';
import { formatNumber } from '../utils/format';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['my-stats', user?.id],
    queryFn: () => (user?.id ? usersApi.getUserStats(user.id) : null),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['my-profile-games'],
    queryFn: () => gamesApi.getMyGames({ limit: 4 }),
    staleTime: 30000,
  });

  const { data: ratingHistory } = useQuery({
    queryKey: ['rating-history', user?.id],
    queryFn: () => (user?.id ? usersApi.getRatingHistory(user.id) : []),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const currentRating = stats?.currentRating ?? 1200;
  const peakRating = stats?.peakRating ?? 1200;
  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const draws = stats?.draws ?? 0;
  const winRate = (() => {
    if (typeof stats?.winRate === 'number' && !isNaN(stats.winRate)) {
      return stats.winRate <= 1 ? Math.round(stats.winRate * 100) : Math.round(stats.winRate);
    }
    return gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  })();

  return (
    <PageContainer
      headerProps={{
        title: 'Shaxsiy profil',
        rightAction: (
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Sozlamalar"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        ),
      }}
    >
      <div className="flex flex-col gap-5">
        {/* Profile Card Header */}
        <Card className="p-5 bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-900 border-indigo-900/40 text-center flex flex-col items-center">
          <Avatar
            src={user?.avatarUrl}
            name={user?.displayName || 'Foydalanuvchi'}
            size="xl"
            className="mb-3 ring-4 ring-indigo-500/20"
          />

          <h2 className="text-lg font-bold text-zinc-100">
            {user?.displayName || 'O\'yinchi'}
          </h2>
          {user?.username && (
            <span className="text-xs text-zinc-400 font-mono">@{user.username}</span>
          )}

          <div className="mt-3">
            <RatingBadge rating={currentRating} />
          </div>

          {/* Wallet summary strip */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/80 w-full justify-around text-xs">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold">{formatNumber(wallet?.balance || 1000)} tanga</span>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-1 text-indigo-400 font-semibold hover:underline"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Do'kon</span>
            </button>
          </div>
        </Card>

        {/* Detailed Stats Grid */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            O'yin ko'rsatkichlari
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            {statsLoading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <StatCard
                  label="Jami o'yinlar"
                  value={gamesPlayed}
                  icon={<Zap className="w-4 h-4 text-indigo-400" />}
                />
                <StatCard
                  label="G'alaba darajasi"
                  value={`${winRate}%`}
                  icon={<Flame className="w-4 h-4 text-rose-400" />}
                />
                <StatCard
                  label="G'alabalar / Mag'lubiyat"
                  value={`${wins} / ${losses}`}
                  subValue={`${draws} durang`}
                  icon={<Trophy className="w-4 h-4 text-amber-400" />}
                />
                <StatCard
                  label="Eng yuqori reyting"
                  value={peakRating}
                  icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                />
              </>
            )}
          </div>
        </div>

        {/* Recent Games List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              O'yinlar tarixi
            </h3>
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
          ) : gamesData?.items && gamesData.items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {gamesData.items.map((game) => (
                <GameCard key={game.id} game={game} myUserId={user?.id} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-zinc-500 text-xs border-dashed border-zinc-800">
              O'yinlar tarixi mavjud emas.
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
