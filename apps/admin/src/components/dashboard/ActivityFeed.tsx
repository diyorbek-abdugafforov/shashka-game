import React from 'react';
import { Gamepad2, UserPlus, AlertCircle, ShieldAlert, Award } from 'lucide-react';
import { formatRelativeTime } from '@/utils/format';
import type { ActivityItem } from '@/api/dashboard';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'GAME_FINISHED':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'GAME_STARTED':
        return <Gamepad2 className="w-4 h-4 text-sky-400" />;
      case 'USER_REGISTERED':
        return <UserPlus className="w-4 h-4 text-amber-400" />;
      case 'REPORT_FILED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'ADMIN_ACTION':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <Gamepad2 className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getIconBg = (type: ActivityItem['type']) => {
    switch (type) {
      case 'GAME_FINISHED':
        return 'bg-emerald-950/60 border-emerald-800/60';
      case 'GAME_STARTED':
        return 'bg-sky-950/60 border-sky-800/60';
      case 'USER_REGISTERED':
        return 'bg-amber-950/60 border-amber-800/60';
      case 'REPORT_FILED':
        return 'bg-rose-950/60 border-rose-800/60';
      case 'ADMIN_ACTION':
        return 'bg-purple-950/60 border-purple-800/60';
      default:
        return 'bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-zinc-100 text-base">Soʻnggi harakatlar (Live Activity)</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Platformadagi eng oxirgi hodisalar oqimi</p>
        </div>
        <span className="text-xs font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
          Realtime
        </span>
      </div>

      <div className="divide-y divide-zinc-800/70">
        {activities.map((item) => (
          <div key={item.id} className="py-3.5 flex items-start gap-3.5 first:pt-1 last:pb-1">
            <div
              className={`p-2 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                item.type,
              )}`}
            >
              {getActivityIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200 truncate">{item.title}</p>
                <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed break-words">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
