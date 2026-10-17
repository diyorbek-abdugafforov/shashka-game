import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi, type GameListItem } from '@/api/games';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { GameMode, GameStatus } from '@shashka/shared-types';
import {
  formatDateTime,
  getGameModeLabel,
  getGameStatusInfo,
} from '@/utils/format';
import { Eye, ShieldAlert, RefreshCw, Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export const GamesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { canPerformAction } = useAuthStore();

  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected game for detail modal
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Abort dialog state
  const [abortTarget, setAbortTarget] = useState<GameListItem | null>(null);
  const [abortReason, setAbortReason] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'games', { page, limit, modeFilter, statusFilter }],
    queryFn: () =>
      gamesApi.getGames({
        page,
        limit,
        mode: modeFilter !== 'ALL' ? (modeFilter as GameMode) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as GameStatus) : undefined,
      }),
  });

  const { data: gameDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin', 'game', selectedGameId],
    queryFn: () => gamesApi.getGameById(selectedGameId!),
    enabled: !!selectedGameId,
  });

  const abortMutation = useMutation({
    mutationFn: ({ gameId, reason }: { gameId: string; reason: string }) =>
      gamesApi.abortGame(gameId, reason),
    onSuccess: () => {
      setAbortTarget(null);
      setAbortReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] });
    },
  });

  const columns: Column<GameListItem>[] = [
    {
      key: 'id',
      header: 'Partiya ID',
      render: (game) => (
        <span className="font-mono text-xs font-semibold text-zinc-300">
          #{game.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'mode',
      header: 'Rejim',
      render: (game) => (
        <div className="flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-amber-500" />
          <span className="text-zinc-200 text-xs font-medium">{getGameModeLabel(game.mode)}</span>
          {game.isRated && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1 rounded font-mono">
              Rated
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'players',
      header: 'Oʻyinchilar (Oq / Qora)',
      render: (game) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <span className="text-zinc-400">⚪</span>
            <span className="font-medium truncate max-w-[120px]">
              {game.whitePlayer?.displayName || 'Kutilmoqda...'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 mt-0.5">
            <span className="text-zinc-600">⚫</span>
            <span className="font-medium truncate max-w-[120px]">
              {game.blackPlayer?.displayName || 'Kutilmoqda...'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      render: (game) => {
        const info = getGameStatusInfo(game.status);
        return (
          <Badge variant={info.variant} size="sm">
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: 'moves',
      header: 'Yurishlar',
      render: (game) => (
        <span className="font-mono text-zinc-300 text-xs">{game.moveCount} ta</span>
      ),
    },
    {
      key: 'startedAt',
      header: 'Boshlangan vaqti',
      render: (game) => (
        <span className="text-xs text-zinc-400 font-mono">{formatDateTime(game.startedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (game) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSelectedGameId(game.id)}
            title="Yurishlar va partiyani koʻrish"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-100" />
          </Button>

          {game.status === GameStatus.IN_PROGRESS && canPerformAction('ban') && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setAbortTarget(game)}
              title="Oʻyinni majburiy toʻxtatish (Abort)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Oʻyinlar Monitoringi</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Platformadagi barcha shashka partiyalari, jonli oʻyinlar va yurishlar tarixi
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

      {/* Filters */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          value={modeFilter}
          onChange={(e) => {
            setModeFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Barcha rejimlar' },
            { value: GameMode.CLASSIC, label: 'Klassik shashka' },
            { value: GameMode.BLITZ, label: 'Blitz' },
            { value: GameMode.GIVEAWAY, label: 'Poddavki' },
            { value: GameMode.BOT, label: 'Bot bilan' },
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
            { value: GameStatus.IN_PROGRESS, label: 'Hozir oʻyinda (In Progress)' },
            { value: GameStatus.FINISHED, label: 'Yakunlangan' },
            { value: GameStatus.WAITING_FOR_PLAYERS, label: 'Kutilmoqda' },
            { value: GameStatus.ABORTED, label: 'Bekor qilingan' },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        keyExtractor={(game) => game.id}
        isLoading={isLoading}
        onRowClick={(game) => setSelectedGameId(game.id)}
        pagination={{
          page,
          totalPages: data?.meta?.totalPages || 1,
          total: data?.meta?.total,
          limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Game Details Modal */}
      <Modal
        isOpen={!!selectedGameId}
        onClose={() => setSelectedGameId(null)}
        title={
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-500" />
            <span>Partiya tafsilotlari #{selectedGameId?.slice(0, 8)}</span>
          </div>
        }
        size="lg"
      >
        {isDetailLoading || !gameDetail ? (
          <div className="py-12 text-center text-zinc-400">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-6">
            {/* Players summary */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div>
                <span className="text-xs text-zinc-400 block mb-1">⚪ Oq donalar:</span>
                <span className="text-base font-bold text-zinc-100 block">
                  {gameDetail.whitePlayer?.displayName || 'Anonim'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {gameDetail.whitePlayer?.username ? `@${gameDetail.whitePlayer.username}` : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">⚫ Qora donalar:</span>
                <span className="text-base font-bold text-zinc-100 block">
                  {gameDetail.blackPlayer?.displayName || 'Anonim'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {gameDetail.blackPlayer?.username ? `@${gameDetail.blackPlayer.username}` : ''}
                </span>
              </div>
            </div>

            {/* Moves List */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Yurishlar tarixi ({gameDetail.moves.length} ta)
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-xl bg-zinc-950/60 border border-zinc-800 p-3 divide-y divide-zinc-800/80 font-mono text-xs">
                {gameDetail.moves.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">Hali yurishlar qilinmagan</p>
                ) : (
                  gameDetail.moves.map((move) => (
                    <div key={move.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 w-8">#{move.moveNumber}.</span>
                        <span className="text-zinc-300">
                          {move.player === 'WHITE' ? '⚪ Oq' : '⚫ Qora'}
                        </span>
                        <span className="font-bold text-amber-400">{move.notation}</span>
                      </div>
                      <span className="text-zinc-500 text-[11px]">
                        {formatDateTime(move.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Abort Game Dialog */}
      <Modal
        isOpen={!!abortTarget}
        onClose={() => setAbortTarget(null)}
        title="Partiyani majburiy toʻxtatish (Abort)"
        description="Bu amal oʻyinni zudlik bilan toʻxtatadi va audit jurnaliga sababi bilan yoziladi."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAbortTarget(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (abortTarget && abortReason.trim()) {
                  abortMutation.mutate({ gameId: abortTarget.id, reason: abortReason.trim() });
                }
              }}
              isLoading={abortMutation.isPending}
            >
              Partiyani toʻxtatish
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-300">Toʻxtatish sababi</label>
          <textarea
            value={abortReason}
            onChange={(e) => setAbortReason(e.target.value)}
            placeholder="Masalan: Qoidabuzarlik yoki texnik server qayta ishga tushishi"
            rows={3}
            className="w-full bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </Modal>
    </div>
  );
};
