import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, type AuditLogItem } from '@/api/audit';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AdminActionType } from '@shashka/shared-types';
import { formatDateTime } from '@/utils/format';
import { ClipboardList, Eye, RefreshCw, Shield } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'audit', { page, limit, actionFilter }],
    queryFn: () =>
      auditApi.getAuditLogs({
        page,
        limit,
        action: actionFilter !== 'ALL' ? (actionFilter as AdminActionType) : undefined,
      }),
  });

  const getActionBadge = (action: AdminActionType) => {
    switch (action) {
      case 'BAN_USER':
        return <Badge variant="danger" size="sm">Bloklash (Ban)</Badge>;
      case 'UNBAN_USER':
        return <Badge variant="success" size="sm">Blokdan chiqarish</Badge>;
      case 'UPDATE_WALLET_BALANCE':
        return <Badge variant="amber" size="sm">Hamyon oʻzgarishi</Badge>;
      case 'RESOLVE_REPORT':
        return <Badge variant="info" size="sm">Shikoyat koʻrib chiqildi</Badge>;
      case 'TOGGLE_FEATURE_FLAG':
        return <Badge variant="purple" size="sm">Feature Flag</Badge>;
      case 'UPDATE_SYSTEM_SETTING':
        return <Badge variant="warning" size="sm">Sozlama oʻzgardi</Badge>;
      case 'ABORT_GAME':
        return <Badge variant="danger" size="sm">Partiya toʻxtatildi</Badge>;
      default:
        return <Badge variant="default" size="sm">{action}</Badge>;
    }
  };

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'createdAt',
      header: 'Vaqt',
      render: (log) => (
        <span className="text-xs text-zinc-400 font-mono">{formatDateTime(log.createdAt)}</span>
      ),
    },
    {
      key: 'admin',
      header: 'Admin / Ijrochi',
      render: (log) => (
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-zinc-200 text-xs">
            {log.admin?.displayName || log.adminId}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Harakat turi',
      render: (log) => getActionBadge(log.action),
    },
    {
      key: 'target',
      header: 'Obyekt (Target)',
      render: (log) => (
        <div className="text-xs font-mono">
          <span className="text-zinc-500 uppercase">{log.targetType}: </span>
          <span className="text-zinc-300 font-semibold">{log.targetId}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Tafsilotlar',
      render: (log) => (
        <span className="text-xs text-zinc-400 font-mono truncate max-w-xs block">
          {JSON.stringify(log.details)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Koʻrish',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (log) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setSelectedLog(log)}
          title="Batafsil maʼlumot"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-100" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Audit Jurnali (Audit Log)</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Barcha admin va moderatorlar tomonidan amalga oshirilgan xatti-harakatlar xronologiyasi
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

      {/* Filter */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
        <Select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Barcha harakat turlari' },
            { value: AdminActionType.BAN_USER, label: 'Foydalanuvchini bloklash (BAN_USER)' },
            { value: AdminActionType.UNBAN_USER, label: 'Blokdan chiqarish (UNBAN_USER)' },
            { value: AdminActionType.UPDATE_WALLET_BALANCE, label: 'Hamyon balansi oʻzgarishi' },
            { value: AdminActionType.RESOLVE_REPORT, label: 'Shikoyatni koʻrib chiqish' },
            { value: AdminActionType.TOGGLE_FEATURE_FLAG, label: 'Feature Flag oʻzgartirish' },
            { value: AdminActionType.UPDATE_SYSTEM_SETTING, label: 'Tizim sozlamalari' },
            { value: AdminActionType.ABORT_GAME, label: 'Oʻyinni majburiy toʻxtatish' },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        keyExtractor={(log) => log.id}
        isLoading={isLoading}
        onRowClick={(log) => setSelectedLog(log)}
        pagination={{
          page,
          totalPages: data?.meta?.totalPages || 1,
          total: data?.meta?.total,
          limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span>Audit harakati tafsilotlari #{selectedLog?.id}</span>
          </div>
        }
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block">Ijrochi:</span>
                <span className="font-bold text-zinc-100 block text-sm">
                  {selectedLog.admin?.displayName || selectedLog.adminId}
                </span>
                <span className="text-amber-400 font-mono">
                  {selectedLog.admin?.role || 'ADMIN'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Vaqt:</span>
                <span className="font-mono text-zinc-200 block text-sm">
                  {formatDateTime(selectedLog.createdAt)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-1">
                JSON maʼlumotlari (Payload):
              </span>
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
