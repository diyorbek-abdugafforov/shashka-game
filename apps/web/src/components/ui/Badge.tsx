import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'indigo' | 'violet' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    neutral: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    danger: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
    violet: 'bg-violet-950/80 text-violet-300 border-violet-800/60',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border shadow-xs select-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
