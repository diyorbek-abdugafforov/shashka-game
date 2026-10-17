import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gamepad2, User, Trophy, BarChart3, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/telegram';
import { useTranslation } from '../../i18n';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/profile',
      label: t('nav_profile'),
      icon: User,
    },
    {
      to: '/',
      label: t('nav_play'),
      icon: Gamepad2,
    },
    {
      to: '/tournaments',
      label: t('nav_tournaments'),
      icon: Trophy,
      badge: t('nav_coming_soon'),
    },
    {
      to: '/leaderboard',
      label: t('nav_leaderboard'),
      icon: BarChart3,
    },
    {
      to: '/settings',
      label: t('nav_settings'),
      icon: Menu,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => triggerHaptic('selection')}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] min-h-[46px]',
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 font-medium',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-transform duration-150',
                        isActive && 'scale-110 text-indigo-400',
                      )}
                    />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-6 text-[8px] font-bold px-1 py-0.2 bg-violet-600/90 text-white rounded-full whitespace-nowrap shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight select-none">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
