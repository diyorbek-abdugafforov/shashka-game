import React from 'react';
import { useAuthStore } from '@/stores/auth';
import { Badge } from '@/components/ui/Badge';
import { getRoleBadgeInfo } from '@/utils/format';
import { Bell, LogOut, Menu, Shield, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleInfo = getRoleBadgeInfo(user?.role || 'USER');

  return (
    <header className="h-16 px-6 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Status */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Menyuni ochish/yopish"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {title && <h1 className="text-lg font-bold text-zinc-100">{title}</h1>}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="success" size="sm" dot>
            Server Online
          </Badge>
          <span className="text-xs text-zinc-500 font-mono">v1.0.0</span>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        <button
          aria-label="Bildirishnomalar"
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </button>

        <div className="h-6 w-px bg-zinc-800" />

        {/* Admin Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 border border-amber-400/30 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-zinc-200 leading-tight">
                {user?.displayName || 'Admin'}
              </span>
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-0.5">
              <Badge variant={roleInfo.variant} size="sm">
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Tizimdan chiqish (Logout)"
          className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
