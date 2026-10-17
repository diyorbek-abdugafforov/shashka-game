import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subValue,
  trend,
  className,
}) => {
  return (
    <Card className={cn('flex flex-col justify-between p-3.5', className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-zinc-400 truncate">{label}</span>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-300 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-zinc-100">{value}</span>
        {subValue && (
          <span
            className={cn(
              'text-[11px] font-medium',
              trend === 'up' && 'text-emerald-400',
              trend === 'down' && 'text-rose-400',
              trend === 'neutral' && 'text-zinc-400',
              !trend && 'text-zinc-400',
            )}
          >
            {subValue}
          </span>
        )}
      </div>
    </Card>
  );
};
