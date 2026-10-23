import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, Users, Trophy, Sparkles, Megaphone, Clock } from 'lucide-react';
import { notificationsApi, type NotificationModel } from '../../api/notifications';
import { triggerHaptic } from '../../utils/telegram';
import { cn } from '../../utils/cn';

export const NotificationCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationsApi.getNotifications(),
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const handleOpen = () => {
    triggerHaptic('light');
    setIsOpen(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_ADDED':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'TOURNAMENT_ANNOUNCEMENT':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'ADMIN_BROADCAST':
      default:
        return <Megaphone className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
        title="Bildirishnomalar"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl max-h-[85vh] animate-in zoom-in-95 duration-150 mt-4 sm:mt-0">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-100">Bildirishnomalar</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                    {unreadCount} ta yangi
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Hozircha hech qanday bildirishnoma yo'q
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markReadMutation.mutate(n.id);
                    }}
                    className={cn(
                      'p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1',
                      n.isRead
                        ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
                        : 'bg-indigo-950/30 border-indigo-600/40 text-zinc-200 shadow-xs',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-100">
                        {getNotificationIcon(n.type)}
                        <span>{n.title}</span>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed pl-5">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-zinc-500 pl-5">
                      {new Date(n.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
