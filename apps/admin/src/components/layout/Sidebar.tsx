import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  AlertTriangle,
  ShoppingBag,
  Settings,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: 'dashboard' | 'users' | 'games' | 'reports' | 'shop' | 'settings' | 'audit';
  path: string;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { canAccess } = useAuthStore();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Boshqaruv paneli (Dashboard)',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'users',
      path: '/users',
      label: 'Foydalanuvchilar (Users)',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'games',
      path: '/games',
      label: 'Oʻyinlar (Games)',
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    {
      id: 'reports',
      path: '/reports',
      label: 'Shikoyatlar (Reports)',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      id: 'shop',
      path: '/shop',
      label: 'Doʻkon (Shop)',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Sozlamalar (Settings)',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'audit',
      path: '/audit',
      label: 'Audit jurnali (Audit Log)',
      icon: <ClipboardList className="w-5 h-5" />,
    },
  ];

  const visibleItems = navItems.filter((item) => canAccess(item.id));

  return (
    <aside
      className={cn(
        'relative bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between transition-all duration-300 z-40 select-none',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div>
        {/* Brand / Logo */}
        <div className="h-16 px-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-amber-900/30 shrink-0">
              Ш
            </div>
            {!collapsed && (
              <div className="transition-opacity duration-200">
                <span className="font-extrabold text-base tracking-tight text-white block">
                  Shashka Admin
                </span>
                <span className="text-[11px] text-zinc-400 block -mt-0.5">
                  Boshqaruv Tizimi
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-transparent',
                  collapsed && 'justify-center px-0',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="shrink-0 transition-transform group-hover:scale-105">{item.icon}</div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer & Collapse button */}
      <div className="p-3 border-t border-zinc-800 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Xavfsiz ulanish (SSL)</span>
          </div>
        )}

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-xs font-medium"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Menyuni yigʻish</span>}
        </button>
      </div>
    </aside>
  );
};
