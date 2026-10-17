import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
        {icon || <Inbox className="w-6 h-6 text-zinc-500" />}
      </div>
      <h4 className="text-base font-semibold text-zinc-200 mb-1">{title}</h4>
      {description && <p className="text-xs text-zinc-400 max-w-sm mb-5">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
