import React from 'react';
import { Trophy, Award, Shield, Crown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface RatingBadgeProps {
  rating: number;
  showRankName?: boolean;
  className?: string;
}

export function getRankDetails(rating: number) {
  if (rating >= 2000) {
    return {
      title: 'Grossmeyster',
      color: 'text-amber-400 bg-amber-950/60 border-amber-600/50',
      icon: Crown,
    };
  }
  if (rating >= 1500) {
    return {
      title: 'Usta',
      color: 'text-violet-400 bg-violet-950/60 border-violet-600/50',
      icon: Trophy,
    };
  }
  if (rating >= 1000) {
    return {
      title: 'Usta nomzodi',
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-600/50',
      icon: Award,
    };
  }
  if (rating >= 500) {
    return {
      title: 'Tajribali',
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-600/50',
      icon: Shield,
    };
  }
  if (rating >= 200) {
    return {
      title: 'Havaskor',
      color: 'text-blue-400 bg-blue-950/60 border-blue-600/50',
      icon: Shield,
    };
  }
  return {
    title: 'Boshlovchi',
    color: 'text-zinc-400 bg-zinc-900 border-zinc-700',
    icon: Shield,
  };
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  showRankName = true,
  className,
}) => {
  const { title, color, icon: Icon } = getRankDetails(rating);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-xs select-none',
        color,
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{rating}</span>
      {showRankName && <span className="opacity-75 font-normal">· {title}</span>}
    </div>
  );
};
