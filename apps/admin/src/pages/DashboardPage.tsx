import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { GamesChart } from '@/components/dashboard/GamesChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Download } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: dashboardApi.getOverview,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return <LoadingSpinner text="Boshqaruv paneli maʼlumotlari yuklanmoqda..." size="lg" />;
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-bold text-rose-400">Maʼlumotlarni yuklashda xatolik</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Server bilan aloqa oʻrnatib boʻlmadi yoki server vaqtinchalik javob bermayapti.
        </p>
        <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>
          Qayta urinish
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Shashka Platformasi Koʻrsatkichlari</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Oʻyinlar, oʻyinchilar oqimi va tizim barqarorligi koʻrsatkichlari
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Yangilash
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => {
              const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(jsonBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `shashka-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
          >
            Hisobotni yuklab olish
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={data.stats} />

      {/* Main Charts */}
      <GamesChart dailyGames={data.dailyGames} modeDistribution={data.modeDistribution} />

      {/* Activity Feed */}
      <ActivityFeed activities={data.recentActivities} />
    </div>
  );
};
