import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, type ReportListItem } from '@/api/reports';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ReportReason, ReportStatus } from '@shashka/shared-types';
import {
  formatDateTime,
  getReportReasonLabel,
  getReportStatusInfo,
} from '@/utils/format';
import { AlertTriangle, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { canPerformAction } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected report for detail/action modal
  const [selectedReport, setSelectedReport] = useState<ReportListItem | null>(null);
  const [actionNote, setActionNote] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'reports', { page, limit, statusFilter, reasonFilter }],
    queryFn: () =>
      reportsApi.getReports({
        page,
        limit,
        status: statusFilter !== 'ALL' ? (statusFilter as ReportStatus) : undefined,
        reason: reasonFilter !== 'ALL' ? (reasonFilter as ReportReason) : undefined,
      }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ status }: { status: ReportStatus }) => {
      if (!selectedReport) throw new Error('Shikoyat tanlanmagan');
      return reportsApi.resolveReport({
        reportId: selectedReport.id,
        status,
        actionNote: actionNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSelectedReport(null);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  const columns: Column<ReportListItem>[] = [
    {
      key: 'reason',
      header: 'Shikoyat sababi',
      render: (report) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-zinc-200 text-xs">
            {getReportReasonLabel(report.reason)}
          </span>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Yuboruvchi',
      render: (report) => (
        <span className="text-zinc-300 text-xs font-medium">
          {report.reporter?.displayName || 'Nomaʼlum'}
        </span>
      ),
    },
    {
      key: 'reportedUser',
      header: 'Shikoyat qilingan',
      render: (report) => (
        <span className="text-zinc-200 text-xs font-semibold">
          {report.reportedUser ? (
            <span className="text-rose-400">{report.reportedUser.displayName}</span>
          ) : (
            <span className="text-zinc-500">-</span>
          )}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Tavsif',
      render: (report) => (
        <p className="text-xs text-zinc-400 truncate max-w-xs">{report.description}</p>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      render: (report) => {
        const info = getReportStatusInfo(report.status);
        return (
          <Badge variant={info.variant} size="sm">
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Vaqti',
      render: (report) => (
        <span className="text-xs text-zinc-400 font-mono">{formatDateTime(report.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (report) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSelectedReport(report)}
            title="Koʻrib chiqish"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-100" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Shikoyatlar va Moderatsiya</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Oʻyinchilar tomonidan yuborilgan shikoyatlar, qoidabuzarliklar va koʻrib chiqish
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Barcha holatlar' },
            { value: ReportStatus.PENDING, label: 'Kutilayotgan (Pending)' },
            { value: ReportStatus.UNDER_REVIEW, label: 'Koʻrib chiqilmoqda' },
            { value: ReportStatus.RESOLVED, label: 'Hal qilingan (Resolved)' },
            { value: ReportStatus.REJECTED, label: 'Rad etilgan (Rejected)' },
          ]}
        />

        <Select
          value={reasonFilter}
          onChange={(e) => {
            setReasonFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Barcha sabablar' },
            { value: ReportReason.CHEATING, label: 'Firibgarlik (Cheating)' },
            { value: ReportReason.OFFENSIVE_BEHAVIOR, label: 'Haqoratli xatti-harakat' },
            { value: ReportReason.STALLING, label: 'Vaqtni choʻzish (Stalling)' },
            { value: ReportReason.INAPPROPRIATE_PROFILE, label: 'Notoʻgʻri profil' },
            { value: ReportReason.OTHER, label: 'Boshqa' },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        keyExtractor={(report) => report.id}
        isLoading={isLoading}
        onRowClick={(report) => setSelectedReport(report)}
        pagination={{
          page,
          totalPages: data?.meta?.totalPages || 1,
          total: data?.meta?.total,
          limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Report Resolution Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Shikoyatni koʻrib chiqish</span>
          </div>
        }
        size="lg"
        footer={
          canPerformAction('resolve_report') && selectedReport?.status === ReportStatus.PENDING ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => resolveMutation.mutate({ status: ReportStatus.REJECTED })}
                isLoading={resolveMutation.isPending}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Rad etish (Reject)
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => resolveMutation.mutate({ status: ReportStatus.RESOLVED })}
                isLoading={resolveMutation.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Hal qilingan deb belgilash (Resolve)
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setSelectedReport(null)}>
              Yopish
            </Button>
          )
        }
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div>
                <span className="text-xs text-zinc-400 block mb-0.5">Yuboruvchi:</span>
                <span className="font-semibold text-zinc-100 text-sm">
                  {selectedReport.reporter?.displayName}
                </span>
                <span className="text-xs text-zinc-500 font-mono block">
                  ID: {selectedReport.reporterId}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-0.5">Shikoyat qilingan foydalanuvchi:</span>
                <span className="font-semibold text-rose-400 text-sm">
                  {selectedReport.reportedUser?.displayName || 'Koʻrsatilmagan'}
                </span>
                {selectedReport.reportedUserId && (
                  <span className="text-xs text-zinc-500 font-mono block">
                    ID: {selectedReport.reportedUserId}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Shikoyat mazmuni:</span>
                <Badge variant="warning">{getReportReasonLabel(selectedReport.reason)}</Badge>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                {selectedReport.description}
              </p>
            </div>

            {canPerformAction('resolve_report') && selectedReport.status === ReportStatus.PENDING && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Moderator izohi (Audit jurnali uchun):
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Qanday chora koʻrilganligi yoki rad etish sababi..."
                  rows={3}
                  className="w-full bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
