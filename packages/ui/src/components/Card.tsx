import React from 'react';
import { cn } from '../utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 text-zinc-100 shadow-md backdrop-blur-sm',
        hoverable && 'transition-all duration-200 hover:border-zinc-700 hover:shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
