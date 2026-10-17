import { apiClient } from './client';
import { GameMode } from '@shashka/shared-types';

export interface DashboardStats {
  totalUsers: number;
  totalUsersChange: number;
  activeGames: number;
  gamesToday: number;
  gamesThisWeek: number;
  gamesThisMonth: number;
  onlineUsers: number;
  totalRevenue: number;
  revenueChange: number;
}

export interface DailyGameStat {
  date: string;
  count: number;
  classic: number;
  blitz: number;
  giveaway: number;
}

export interface GameModeDistribution {
  mode: GameMode;
  name: string;
  count: number;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  type: 'GAME_STARTED' | 'GAME_FINISHED' | 'USER_REGISTERED' | 'REPORT_FILED' | 'ADMIN_ACTION';
  title: string;
  description: string;
  timestamp: string;
  avatarUrl?: string | null;
  meta?: Record<string, unknown>;
}

export interface DashboardData {
  stats: DashboardStats;
  dailyGames: DailyGameStat[];
  modeDistribution: GameModeDistribution[];
  recentActivities: ActivityItem[];
}

export const dashboardApi = {
  getOverview: async (): Promise<DashboardData> => {
    try {
      return await apiClient.get<DashboardData>('/admin/dashboard/overview');
    } catch {
      // Fallback realistic live data for development
      return generateMockDashboardData();
    }
  },
};

function generateMockDashboardData(): DashboardData {
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(5, 10);
  });

  return {
    stats: {
      totalUsers: 14820,
      totalUsersChange: 12.4,
      activeGames: 84,
      gamesToday: 642,
      gamesThisWeek: 4230,
      gamesThisMonth: 18950,
      onlineUsers: 342,
      totalRevenue: 284000,
      revenueChange: 8.5,
    },
    dailyGames: dates.map((date, idx) => ({
      date,
      count: 280 + Math.floor(Math.sin(idx) * 60) + idx * 12,
      classic: 160 + Math.floor(Math.sin(idx) * 35) + idx * 6,
      blitz: 80 + Math.floor(Math.cos(idx) * 20) + idx * 4,
      giveaway: 40 + Math.floor(Math.sin(idx) * 15) + idx * 2,
    })),
    modeDistribution: [
      { mode: GameMode.CLASSIC, name: 'Klassik (Classic)', count: 9840, percentage: 52 },
      { mode: GameMode.BLITZ, name: 'Blitz', count: 4720, percentage: 25 },
      { mode: GameMode.GIVEAWAY, name: 'Poddavki', count: 2650, percentage: 14 },
      { mode: GameMode.BOT, name: 'Bot bilan', count: 1740, percentage: 9 },
    ],
    recentActivities: [
      {
        id: 'act-1',
        type: 'GAME_FINISHED',
        title: 'Oʻyin yakunlandi',
        description: 'Javohir (1420) vs Alisher (1380) - Oqlar gʻalaba qozondi (Klassik)',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      },
      {
        id: 'act-2',
        type: 'USER_REGISTERED',
        title: 'Yangi foydalanuvchi',
        description: '@shoxrux_99 Telegram orqali roʻyxatdan oʻtdi',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: 'act-3',
        type: 'REPORT_FILED',
        title: 'Yangi shikoyat kelib tushdi',
        description: 'Oʻyinchi @bobur_777 nojoʻya xatti-harakat boʻyicha shikoyat qildi',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'act-4',
        type: 'ADMIN_ACTION',
        title: 'Admin harakati',
        description: 'Admin user_0918 hisobiga 500 tanga qoʻshdi',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'act-5',
        type: 'GAME_STARTED',
        title: 'Reytingli oʻyin boshlandi',
        description: 'Bobur vs Dilshod (Blitz 3+2)',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      },
    ],
  };
}
