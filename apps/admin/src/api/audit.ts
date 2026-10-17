import { apiClient } from './client';
import type { AdminActionModel, AdminActionType, PaginatedResponse, UserModel } from '@shashka/shared-types';

export interface AuditLogItem extends AdminActionModel {
  admin?: UserModel | null;
}

export interface AuditFilterParams {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: AdminActionType;
  startDate?: string;
  endDate?: string;
}

export const auditApi = {
  getAuditLogs: async (params?: AuditFilterParams): Promise<PaginatedResponse<AuditLogItem>> => {
    try {
      return await apiClient.get<PaginatedResponse<AuditLogItem>>('/admin/audit', {
        page: params?.page ?? 1,
        limit: params?.limit ?? 15,
        adminId: params?.adminId,
        action: params?.action,
        startDate: params?.startDate,
        endDate: params?.endDate,
      });
    } catch {
      return getMockAuditLogs(params);
    }
  },
};

function getMockAuditLogs(params?: AuditFilterParams): PaginatedResponse<AuditLogItem> {
  const mockLogs: AuditLogItem[] = [
    {
      id: 'aud-1',
      adminId: 'u-admin-1',
      action: 'UPDATE_WALLET_BALANCE' as any,
      targetType: 'USER',
      targetId: 'u-101',
      details: { amount: 1000, reason: 'Turnir gʻolibi mukofoti' },
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      admin: {
        id: 'u-admin-1',
        displayName: 'Super Admin',
        username: 'superadmin',
        avatarUrl: null,
        language: 'uz',
        role: 'SUPER_ADMIN' as any,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    },
    {
      id: 'aud-2',
      adminId: 'u-admin-2',
      action: 'BAN_USER' as any,
      targetType: 'USER',
      targetId: 'u-103',
      details: { reason: 'Dasturiy vositalardan foydalanish (Engine use)', bannedUntil: '2026-11-01T00:00:00.000Z' },
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      admin: {
        id: 'u-admin-2',
        displayName: 'Moderator Nodira',
        username: 'nodira_mod',
        avatarUrl: null,
        language: 'uz',
        role: 'MODERATOR' as any,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-03-21T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
    },
    {
      id: 'aud-3',
      adminId: 'u-admin-1',
      action: 'TOGGLE_FEATURE_FLAG' as any,
      targetType: 'SETTING',
      targetId: 'ENABLE_TOURNAMENTS',
      details: { enabled: true },
      createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      admin: {
        id: 'u-admin-1',
        displayName: 'Super Admin',
        username: 'superadmin',
        avatarUrl: null,
        language: 'uz',
        role: 'SUPER_ADMIN' as any,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    },
    {
      id: 'aud-4',
      adminId: 'u-admin-2',
      action: 'RESOLVE_REPORT' as any,
      targetType: 'REPORT',
      targetId: 'rep-3',
      details: { status: 'RESOLVED', actionNote: 'Foydalanuvchiga ogohlantirish berildi' },
      createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      admin: {
        id: 'u-admin-2',
        displayName: 'Moderator Nodira',
        username: 'nodira_mod',
        avatarUrl: null,
        language: 'uz',
        role: 'MODERATOR' as any,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-03-21T00:00:00Z',
        updatedAt: '2026-10-14T00:00:00Z',
      },
    },
  ];

  let filtered = mockLogs;
  if (params?.action) {
    filtered = filtered.filter((l) => l.action === params.action);
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 15;
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
