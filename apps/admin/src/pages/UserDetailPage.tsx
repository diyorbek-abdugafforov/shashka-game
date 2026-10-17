import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { BanDialog } from '@/components/users/BanDialog';
import { WalletAdjustDialog } from '@/components/users/WalletAdjustDialog';
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Coins,
  Send,
  Trophy,
  Gamepad2,
  FileText,
} from 'lucide-react';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatCoins,
  getRoleBadgeInfo,
  getGameStatusInfo,
  getGameModeLabel,
} from '@/utils/format';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuthStore } from '@/stores/auth';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canPerformAction } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'wallet' | 'notes'>('overview');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => usersApi.getUserById(id!),
    enabled: !!id,
  });

  const noteMutation = useMutation({
    mutationFn: (note: string) => usersApi.addAdminNote(id!, note),
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Foydalanuvchi maʼlumotlari yuklanmoqda..." size="lg" />;
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-bold text-rose-400">Foydalanuvchi topilmadi</h3>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/users')}>
          Roʻyxatga qaytish
        </Button>
      </div>
    );
  }

  const { user, telegramAccount, stats, wallet, transactions, ratingHistory, recentGames, adminNotes } = data;
  const roleBadge = getRoleBadgeInfo(user.role);

  const tabs = [
    { id: 'overview', label: 'Umumiy maʼlumot', icon: <Trophy className="w-4 h-4" /> },
    { id: 'games', label: 'Oʻyinlar tarixi', count: recentGames.length, icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'wallet', label: 'Hamyon va tranzaksiyalar', count: transactions.length, icon: <Coins className="w-4 h-4" /> },
    { id: 'notes', label: 'Admin eslatmalari', count: adminNotes.length, icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/users')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Orqaga
        </Button>
        <span className="text-xs text-zinc-500 font-mono">Foydalanuvchi tafsilotlari</span>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-2xl text-zinc-200 overflow-hidden shrink-0 shadow-inner">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-zinc-100">{user.displayName}</h2>
                <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                {user.isBanned && (
                  <Badge variant="danger" dot>
                    Bloklangan
                  </Badge>
                )}
                {user.isBot && <Badge variant="purple">Bot</Badge>}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 font-mono">
                {telegramAccount?.username && (
                  <span className="text-amber-400">@{telegramAccount.username}</span>
                )}
                {telegramAccount?.telegramId && (
                  <span>TG ID: {telegramAccount.telegramId}</span>
                )}
                <span>Aʼzo boʻldi: {formatDate(user.createdAt)}</span>
              </div>

              {user.isBanned && user.banReason && (
                <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 px-3 py-1.5 rounded-lg">
                  <span className="font-semibold">Blok sababi:</span> {user.banReason}
                  {user.bannedUntil && ` (Muddati: ${formatDateTime(user.bannedUntil)})`}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {canPerformAction('wallet') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsWalletModalOpen(true)}
                leftIcon={<Coins className="w-4 h-4 text-amber-400" />}
              >
                Balansni boshqarish
              </Button>
            )}

            {canPerformAction('ban') && (
              <Button
                variant={user.isBanned ? 'success' : 'danger'}
                size="sm"
                onClick={() => setIsBanModalOpen(true)}
                leftIcon={
                  user.isBanned ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )
                }
              >
                {user.isBanned ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block">Joriy Reyting</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {Math.round(stats.currentRating)}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                Maksimal: {Math.round(stats.peakRating)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block">Oʻyinlar / Gʻalabalar</span>
              <span className="text-2xl font-bold font-mono text-zinc-100 mt-1 block">
                {stats.gamesPlayed}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
                {stats.wins} gʻalaba / {stats.losses} magʻlubiyat
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block">Gʻalaba koʻrsatkichi (Winrate)</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                {stats.winRate}%
              </span>
              <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                Duranglar: {stats.draws}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-400 block">Hamyon balansi</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {formatCoins(wallet?.balance || 0)}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                Virtual tangalar
              </span>
            </div>
          </div>

          {/* Rating Progress Line Chart */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-zinc-100 text-sm mb-4">
              Reyting dinamikasi (Rating History)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={ratingHistory.map((item) => ({
                    date: formatDate(item.timestamp),
                    rating: Math.round(item.rating),
                    change: item.change,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.5rem',
                      color: '#f4f4f5',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    name="Reyting"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recent Games */}
      {activeTab === 'games' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-zinc-800">
            {recentGames.map((game) => {
              const statusInfo = getGameStatusInfo(game.status);
              const isWhite = game.whitePlayerId === user.id;
              const isWinner = game.winnerId === user.id;

              return (
                <div key={game.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/40">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-300">
                      {isWhite ? '⚪' : '⚫'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200 text-sm">
                          {getGameModeLabel(game.mode)}
                        </span>
                        <Badge variant={statusInfo.variant} size="sm">
                          {statusInfo.label}
                        </Badge>
                        {isWinner ? (
                          <Badge variant="success" size="sm">
                            Gʻalaba
                          </Badge>
                        ) : game.winnerId ? (
                          <Badge variant="danger" size="sm">
                            Magʻlubiyat
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Durang
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 font-mono mt-0.5 block">
                        Yurishlar: {game.moveCount} | Sana: {formatDateTime(game.startedAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/games?gameId=${game.id}`)}
                  >
                    Partiyani koʻrish
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Wallet & Transactions */}
      {activeTab === 'wallet' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-zinc-800">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/40">
                  <div>
                    <span className="text-sm font-medium text-zinc-200 block">{tx.description}</span>
                    <span className="text-xs text-zinc-500 font-mono mt-0.5 block">
                      Turi: {tx.type} | {formatDateTime(tx.createdAt)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-bold font-mono ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${tx.amount}` : tx.amount} 🪙
                    </span>
                    <span className="text-xs text-zinc-500 block font-mono">
                      Qoldiq: {formatNumber(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Admin Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-zinc-200 mb-2">Yangi eslatma qoldirish</h4>
            <div className="flex gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Foydalanuvchi xatti-harakati, shubhali harakatlar yoki maxsus maʼlumotlar..."
                rows={2}
                className="flex-1 bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <Button
                variant="primary"
                onClick={() => {
                  if (newNote.trim()) noteMutation.mutate(newNote.trim());
                }}
                isLoading={noteMutation.isPending}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Qoʻshish
              </Button>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden shadow-sm">
            {adminNotes.map((note) => (
              <div key={note.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400">{note.adminName}</span>
                  <span className="text-zinc-500 font-mono">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-300">{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <BanDialog
        user={
          {
            ...user,
            telegramAccount,
            rating: stats.currentRating,
            gamesPlayed: stats.gamesPlayed,
            walletBalance: wallet?.balance || 0,
          } as any
        }
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <WalletAdjustDialog
        user={
          {
            ...user,
            telegramAccount,
            rating: stats.currentRating,
            gamesPlayed: stats.gamesPlayed,
            walletBalance: wallet?.balance || 0,
          } as any
        }
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
