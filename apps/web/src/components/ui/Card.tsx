import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const variants = {
      default: 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-sm',
      elevated: 'bg-gradient-to-b from-zinc-850 to-zinc-900 border border-zinc-750 text-zinc-100 shadow-lg shadow-black/40',
      glass: 'bg-zinc-900/60 backdrop-blur-md border border-white/10 text-zinc-100',
      outline: 'bg-transparent border border-zinc-800 text-zinc-200',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          hoverable && 'hover:border-zinc-700 active:scale-[0.99] cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
