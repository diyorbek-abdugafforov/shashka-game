import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { DailyGameStat, GameModeDistribution } from '@/api/dashboard';

interface GamesChartProps {
  dailyGames: DailyGameStat[];
  modeDistribution: GameModeDistribution[];
}

const PIE_COLORS = ['#f59e0b', '#38bdf8', '#a855f7', '#10b981'];

export const GamesChart: React.FC<GamesChartProps> = ({ dailyGames, modeDistribution }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 14-Day Activity Area Chart (2 Cols) */}
      <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-zinc-100 text-base">Oʻyinlar dinamikasi (Oxirgi 14 kun)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Kunlik oʻynalgan partiyalar soni va taqsimoti</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Klassik
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Blitz
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Poddavki
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyGames} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClassic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBlitz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorGiveaway" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: '0.5rem',
                  color: '#f4f4f5',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="classic"
                name="Klassik"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClassic)"
              />
              <Area
                type="monotone"
                dataKey="blitz"
                name="Blitz"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBlitz)"
              />
              <Area
                type="monotone"
                dataKey="giveaway"
                name="Poddavki"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGiveaway)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mode Distribution Pie Chart (1 Col) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-zinc-100 text-base">Rejimlar ulushi (Game Modes)</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Oʻyinchilar tanlagan shashka turlari</p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={modeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {modeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`${val} oʻyin`, 'Soni']}
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: '0.5rem',
                  color: '#f4f4f5',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(val) => <span className="text-xs text-zinc-300 font-medium">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          {modeDistribution.map((mode) => (
            <div key={mode.mode} className="flex items-center justify-between">
              <span className="text-zinc-400 truncate">{mode.name}:</span>
              <span className="font-semibold text-zinc-200">{mode.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
