import { apiClient } from './client';
import {
  ReportReason,
  ReportStatus,
  UserRole,
  type PaginatedResponse,
  type ReportModel,
  type ResolveReportRequest,
  type UserModel,
  type GameModel,
} from '@shashka/shared-types';

export interface ReportListItem extends ReportModel {
  reporter?: UserModel | null;
  reportedUser?: UserModel | null;
  reportedGame?: GameModel | null;
  resolver?: UserModel | null;
}

export interface ReportFilterParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  reason?: ReportReason;
}

export const reportsApi = {
  getReports: async (params?: ReportFilterParams): Promise<PaginatedResponse<ReportListItem>> => {
    try {
      return await apiClient.get<PaginatedResponse<ReportListItem>>('/admin/reports', {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        status: params?.status,
        reason: params?.reason,
      });
    } catch {
      return getMockReports(params);
    }
  },

  getReportById: async (reportId: string): Promise<ReportListItem> => {
    try {
      return await apiClient.get<ReportListItem>(`/admin/reports/${reportId}`);
    } catch {
      const reports = getMockReports().items;
      const found = reports.find((r) => r.id === reportId);
      if (!found) throw new Error('Shikoyat topilmadi');
      return found;
    }
  },

  resolveReport: async (data: ResolveReportRequest): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(`/admin/reports/${data.reportId}/resolve`, data);
  },
};

function getMockReports(params?: ReportFilterParams): PaginatedResponse<ReportListItem> {
  const mockReports: ReportListItem[] = [
    {
      id: 'rep-1',
      reporterId: 'u-101',
      reportedUserId: 'u-103',
      reportedGameId: 'g-91',
      reason: ReportReason.CHEATING,
      description: 'Raqib har bir yurishni roppa-rosa 3.2 soniyada qildi va 100% kompyuter aniqligi bilan oʻynadi. Tekshirishingizni soʻrayman.',
      status: ReportStatus.PENDING,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      reporter: {
        id: 'u-101',
        displayName: 'Javohir Sindarov',
        username: 'grandmaster_uz',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.USER,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
      },
      reportedUser: {
        id: 'u-103',
        displayName: 'ToxicPlayer2026',
        username: 'cheater_bot_9',
        avatarUrl: null,
        language: 'ru',
        role: UserRole.USER,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-05-19T14:20:00Z',
        updatedAt: '2026-10-10T16:00:00Z',
      },
    },
    {
      id: 'rep-2',
      reporterId: 'u-104',
      reportedUserId: 'u-102',
      reportedGameId: 'g-88',
      reason: ReportReason.STALLING,
      description: 'Yutqazayotganini bilgach, yurish qilmasdan vaqt tugashini kutib oʻtirdi.',
      status: ReportStatus.UNDER_REVIEW,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      reporter: {
        id: 'u-104',
        displayName: 'Nodira Salimova',
        username: 'nodira_shashka',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.MODERATOR,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-03-21T18:00:00Z',
        updatedAt: '2026-10-14T11:45:00Z',
      },
      reportedUser: {
        id: 'u-102',
        displayName: 'Temur Aliyev',
        username: 'shashka_king',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.ADMIN,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-02-14T08:30:00Z',
        updatedAt: '2026-10-16T09:00:00Z',
      },
    },
    {
      id: 'rep-3',
      reporterId: 'u-102',
      reportedUserId: 'u-103',
      reportedGameId: null,
      reason: ReportReason.OFFENSIVE_BEHAVIOR,
      description: 'Chatda nojoʻya soʻzlar va haqorat ishlatdi.',
      status: ReportStatus.RESOLVED,
      resolvedBy: 'u-admin',
      resolvedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
      resolver: {
        id: 'u-admin',
        displayName: 'Super Admin',
        username: 'admin',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.SUPER_ADMIN,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-10-16T00:00:00Z',
      },
    },
  ];

  let filtered = mockReports;
  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params?.reason) {
    filtered = filtered.filter((r) => r.reason === params.reason);
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items = filtered.slice((page - 1) * limit, page * limit);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
