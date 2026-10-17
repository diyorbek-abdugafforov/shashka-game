import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { useTranslation } from '../i18n';
import { triggerHaptic } from '../utils/telegram';
import { leaderboardApi } from '../api/leaderboard';
import { GameMode, type LeaderboardEntry } from '@shashka/shared-types';
import {
  Trophy,
  Search,
  HelpCircle,
  TrendingUp,
  Puzzle,
  Medal,
  Gem,
  Award,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface LeaderboardUser {
  rank: number;
  name: string;
  elo: number;
  avatar?: string;
  badge?: string;
}

const DEFAULT_USERS: LeaderboardUser[] = [
  {
    rank: 1,
    name: 'Shaxrizod Xamidov',
    elo: 2500,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  },
  {
    rank: 2,
    name: 'Islam ت',
    elo: 2500,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  },
  {
    rank: 3,
    name: 'NAVOIY',
    badge: '💎',
    elo: 2500,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  },
  {
    rank: 4,
    name: 'FAYZULLO',
    elo: 2500,
  },
  {
    rank: 5,
    name: 'Oysha',
    elo: 2500,
  },
  {
    rank: 6,
    name: 'Bekzod Aliyev',
    elo: 2480,
  },
  {
    rank: 7,
    name: 'Jasurbek Grandmaster',
    elo: 2465,
  },
];

export const LeaderboardPage: React.FC = () => {
  const { t, language } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<'pro' | 'puzzles' | 'wins'>('pro');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard-full', selectedFilter],
    queryFn: () => leaderboardApi.getLeaderboard(GameMode.CLASSIC, 50),
    staleTime: 15000,
  });

  // Convert real database entries
  const dbUsers: LeaderboardUser[] = (leaderboardData?.topPlayers || []).map((entry: LeaderboardEntry, idx: number) => ({
    rank: entry.rank || idx + 1,
    name: entry.displayName,
    elo: entry.rating,
    avatar: entry.avatarUrl || undefined,
    badge: entry.rating >= 2000 ? '👑' : entry.rating >= 1500 ? '💎' : undefined,
  }));

  // Combine database users and default list
  const combinedUsers = dbUsers.length > 0
    ? [
        ...dbUsers,
        ...DEFAULT_USERS.filter((d) => !dbUsers.some((u) => u.name.toLowerCase() === d.name.toLowerCase()))
          .map((d, i) => ({ ...d, rank: dbUsers.length + i + 1 })),
      ]
    : DEFAULT_USERS;

  const filteredUsers = combinedUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const topProPlayer = combinedUsers[0]?.name || 'Shaxrizod Xamidov';

  return (
    <PageContainer
      headerProps={{
        title: language === 'ru' ? 'Таблица лидеров' : language === 'en' ? 'Leaderboard' : 'Reyting Jadvali',
        rightAction: (
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowSearch((prev) => !prev);
            }}
            className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
          >
            <Search className="w-4 h-4" />
          </button>
        ),
      }}
    >
      <div className="flex flex-col gap-3.5 pb-6">
        {/* Search input if toggled */}
        {showSearch && (
          <div className="p-1">
            <input
              type="text"
              placeholder={language === 'ru' ? 'Поиск игрока...' : "O'yinchini qidirish..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
        )}

        {/* Filter category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Filter 1 */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedFilter('pro');
            }}
            className={cn(
              'px-3 py-2 rounded-2xl text-left shrink-0 transition-all border select-none min-w-[130px]',
              selectedFilter === 'pro'
                ? 'bg-indigo-950/60 border-indigo-500 text-white'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400',
            )}
          >
            <span className="text-[10px] block font-semibold text-indigo-400">
              📈 Professional (ELO)
            </span>
            <span className="text-xs font-bold block mt-0.5 truncate text-zinc-200">
              👑 {topProPlayer}
            </span>
          </button>

          {/* Filter 2 */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedFilter('puzzles');
            }}
            className={cn(
              'px-3 py-2 rounded-2xl text-left shrink-0 transition-all border select-none min-w-[120px]',
              selectedFilter === 'puzzles'
                ? 'bg-indigo-950/60 border-indigo-500 text-white'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400',
            )}
          >
            <span className="text-[10px] block font-semibold text-violet-400">
              🧩 Masalalar
            </span>
            <span className="text-xs font-bold block mt-0.5 truncate text-zinc-200">
              👑 David Laid
            </span>
          </button>

          {/* Filter 3 */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedFilter('wins');
            }}
            className={cn(
              'px-3 py-2 rounded-2xl text-left shrink-0 transition-all border select-none min-w-[120px]',
              selectedFilter === 'wins'
                ? 'bg-indigo-950/60 border-indigo-500 text-white'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400',
            )}
          >
            <span className="text-[10px] block font-semibold text-amber-400">
              🏁 Eng ko'p yutuq
            </span>
            <span className="text-xs font-bold block mt-0.5 truncate text-zinc-200">
              👑 1972 Akbarov
            </span>
          </button>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between px-1 mt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Professionallar Reytingi (ELO)</span>
          </div>
          <HelpCircle className="w-4 h-4 text-zinc-500 cursor-pointer" />
        </div>

        {/* Leaderboard Table Card */}
        <Card className="p-0 overflow-hidden bg-zinc-900/80 border-zinc-800">
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-850/60 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <div className="flex items-center gap-4">
              <span className="w-5 text-center">#</span>
              <span>O'YINCHI</span>
            </div>
            <span>ELO</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-zinc-800/60">
            {filteredUsers.map((item) => {
              const isFirst = item.rank === 1;
              const isSecond = item.rank === 2;
              const isThird = item.rank === 3;

              return (
                <div
                  key={item.rank}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-850/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank icon / number */}
                    <div className="w-6 flex items-center justify-center font-bold text-xs">
                      {isFirst ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                          <Trophy className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                      ) : isSecond ? (
                        <div className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 flex items-center justify-center">
                          <Medal className="w-3.5 h-3.5" />
                        </div>
                      ) : isThird ? (
                        <div className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-mono text-xs">{item.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-zinc-100 truncate">
                        {item.name}
                      </span>
                      {item.badge && <span className="text-xs">{item.badge}</span>}
                    </div>
                  </div>

                  {/* ELO Rating */}
                  <span className="text-xs font-black font-mono text-indigo-400">
                    {item.elo.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
