import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  isPositive?: boolean | null;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconColor?: 'amber' | 'emerald' | 'sky' | 'purple' | 'rose';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = null,
  changeLabel,
  icon,
  iconColor = 'amber',
  className,
}) => {
  const iconColors = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div
      className={cn(
        'relative bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-5 shadow-sm hover:border-zinc-700/80 transition-all duration-200',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-1 tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-lg border flex items-center justify-center shrink-0', iconColors[iconColor])}>
            {icon}
          </div>
        )}
      </div>

      {(change !== undefined || changeLabel) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center font-medium gap-0.5 px-1.5 py-0.5 rounded',
                isPositive === true && 'bg-emerald-500/10 text-emerald-400',
                isPositive === false && 'bg-rose-500/10 text-rose-400',
                isPositive === null && 'bg-zinc-800 text-zinc-400',
              )}
            >
              {isPositive === true && <ArrowUpRight className="w-3 h-3" />}
              {isPositive === false && <ArrowDownRight className="w-3 h-3" />}
              {isPositive === null && <Minus className="w-3 h-3" />}
              {change}
            </span>
          )}
          {changeLabel && <span className="text-zinc-500">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
};
