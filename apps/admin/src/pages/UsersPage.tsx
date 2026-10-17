import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserListItem } from '@/api/users';
import { UserTable } from '@/components/users/UserTable';
import { BanDialog } from '@/components/users/BanDialog';
import { WalletAdjustDialog } from '@/components/users/WalletAdjustDialog';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { UserRole } from '@shashka/shared-types';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected user for dialogs
  const [banUserTarget, setBanUserTarget] = useState<UserListItem | null>(null);
  const [walletUserTarget, setWalletUserTarget] = useState<UserListItem | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'users', { page, limit, search, roleFilter, statusFilter }],
    queryFn: () =>
      usersApi.getUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
        isBanned: statusFilter === 'BANNED' ? true : statusFilter === 'ACTIVE' ? false : undefined,
      }),
  });

  const handleActionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Foydalanuvchilar Boshqaruvi</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Barcha oʻyinchilar roʻyxati, ularning reytinglari, hamyonlari va sanksiyalar
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
        >
          Yangilash
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Ism, @username yoki Telegram ID boʻyicha qidirish..."
        />

        <Select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Barcha rollar' },
            { value: UserRole.USER, label: 'Foydalanuvchilar (USER)' },
            { value: UserRole.MODERATOR, label: 'Moderatorlar' },
            { value: UserRole.ADMIN, label: 'Adminlar' },
            { value: UserRole.SUPER_ADMIN, label: 'Super Adminlar' },
          ]}
        />

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Barcha holatlar' },
            { value: 'ACTIVE', label: 'Faol oʻyinchilar' },
            { value: 'BANNED', label: 'Bloklanganlar (Banned)' },
          ]}
        />
      </div>

      {/* Data Table */}
      <UserTable
        users={data?.items || []}
        isLoading={isLoading}
        total={data?.meta?.total || 0}
        page={page}
        limit={limit}
        onPageChange={(newPage) => setPage(newPage)}
        onBanClick={(user) => setBanUserTarget(user)}
        onWalletClick={(user) => setWalletUserTarget(user)}
      />

      {/* Ban / Unban Dialog */}
      <BanDialog
        user={banUserTarget}
        isOpen={!!banUserTarget}
        onClose={() => setBanUserTarget(null)}
        onSuccess={handleActionSuccess}
      />

      {/* Wallet Adjustment Dialog */}
      <WalletAdjustDialog
        user={walletUserTarget}
        isOpen={!!walletUserTarget}
        onClose={() => setWalletUserTarget(null)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};
