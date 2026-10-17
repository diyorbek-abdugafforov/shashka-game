import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Users, Gamepad2, Coins, Activity } from 'lucide-react';
import { formatNumber, formatCompactNumber } from '@/utils/format';
import type { DashboardStats } from '@/api/dashboard';

interface StatsGridProps {
  stats: DashboardStats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <StatCard
        title="Jami Foydalanuvchilar"
        value={formatNumber(stats.totalUsers)}
        change={`${stats.totalUsersChange > 0 ? '+' : ''}${stats.totalUsersChange}%`}
        isPositive={stats.totalUsersChange >= 0}
        changeLabel="oʻtgan oyga nisbatan"
        icon={<Users className="w-5 h-5" />}
        iconColor="amber"
      />

      {/* Online Users */}
      <StatCard
        title="Hozir Onlayn"
        value={formatNumber(stats.onlineUsers)}
        change={`${stats.activeGames} ta faol partiya`}
        isPositive={true}
        changeLabel="jonli oʻyinda"
        icon={<Activity className="w-5 h-5" />}
        iconColor="emerald"
      />

      {/* Games Played Today */}
      <StatCard
        title="Bugungi Oʻyinlar"
        value={formatNumber(stats.gamesToday)}
        change={`Haftada: ${formatCompactNumber(stats.gamesThisWeek)}`}
        isPositive={null}
        changeLabel={`Oyda: ${formatCompactNumber(stats.gamesThisMonth)}`}
        icon={<Gamepad2 className="w-5 h-5" />}
        iconColor="sky"
      />

      {/* Platform Economy / Revenue */}
      <StatCard
        title="Aylanmadagi Tangalar"
        value={`${formatCompactNumber(stats.totalRevenue)} 🪙`}
        change={`${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%`}
        isPositive={stats.revenueChange >= 0}
        changeLabel="haftalik faollik"
        icon={<Coins className="w-5 h-5" />}
        iconColor="purple"
      />
    </div>
  );
};
