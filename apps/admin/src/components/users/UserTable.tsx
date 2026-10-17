import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatNumber } from '@/utils/format';
import { Ban, CheckCircle, Eye, Wallet } from 'lucide-react';
import type { UserListItem } from '@/api/users';
import { useAuthStore } from '@/stores/auth';

interface UserTableProps {
  users: UserListItem[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onBanClick: (user: UserListItem) => void;
  onWalletClick: (user: UserListItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onBanClick,
  onWalletClick,
}) => {
  const navigate = useNavigate();
  const { canPerformAction } = useAuthStore();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const columns: Column<UserListItem>[] = [
    {
      key: 'id',
      header: 'Foydalanuvchi',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-zinc-100 block truncate hover:text-amber-400">
              {user.displayName}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono block">
              ID: {user.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'telegram',
      header: 'Telegram Profil',
      render: (user) => (
        <div>
          {user.telegramAccount ? (
            <div>
              <span className="text-zinc-200 block text-xs font-mono">
                {user.telegramAccount.username ? `@${user.telegramAccount.username}` : user.telegramAccount.firstName}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                TG ID: {user.telegramAccount.telegramId}
              </span>
            </div>
          ) : (
            <span className="text-zinc-500 text-xs">Ulanmagan</span>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Reyting',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-bold text-amber-400">{Math.round(user.rating)}</span>
          <span className="text-zinc-500 text-xs">pts</span>
        </div>
      ),
    },
    {
      key: 'gamesPlayed',
      header: 'Oʻyinlar',
      render: (user) => (
        <span className="font-mono text-zinc-300">{formatNumber(user.gamesPlayed)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      render: (user) => {
        if (user.isBanned) {
          return (
            <Badge variant="danger" size="sm" dot>
              Bloklangan
            </Badge>
          );
        }
        if (user.isBot) {
          return (
            <Badge variant="purple" size="sm">
              Bot
            </Badge>
          );
        }
        return (
          <Badge variant="success" size="sm" dot>
            Faol
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Roʻyxatdan oʻtgan',
      render: (user) => (
        <span className="text-xs text-zinc-400 font-mono">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            title="Batafsil koʻrish"
            onClick={() => navigate(`/users/${user.id}`)}
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-100" />
          </Button>

          {canPerformAction('wallet') && (
            <Button
              variant="ghost"
              size="xs"
              title="Balansni toʻldirish/kamaytirish"
              onClick={() => onWalletClick(user)}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
            </Button>
          )}

          {canPerformAction('ban') && (
            <Button
              variant="ghost"
              size="xs"
              title={user.isBanned ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
              onClick={() => onBanClick(user)}
            >
              {user.isBanned ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Ban className="w-3.5 h-3.5 text-rose-400" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      keyExtractor={(user) => user.id}
      isLoading={isLoading}
      onRowClick={(user) => navigate(`/users/${user.id}`)}
      pagination={{
        page,
        totalPages,
        total,
        limit,
        onPageChange,
      }}
    />
  );
};
