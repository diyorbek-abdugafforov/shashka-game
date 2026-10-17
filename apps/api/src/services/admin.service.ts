import prisma, { type Prisma } from '@shashka/database';
import {
  AdminActionType,
  GameStatus,
  ReportStatus,
  UserRole,
} from '@shashka/shared-types';
import { getConfig } from '../config.js';
import { NotFoundError } from '../utils/errors.js';

export interface AdminUserFilterOptions {
  search?: string;
  role?: UserRole;
  isBanned?: boolean;
  page?: number;
  limit?: number;
}

export class AdminService {
  /**
   * Checks whether a user has administrative privileges.
   */
  public static async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { telegramAccount: true },
    });

    if (!user) return false;

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const config = getConfig();
    if (
      user.telegramAccount?.telegramId &&
      config.ADMIN_TELEGRAM_IDS.includes(user.telegramAccount.telegramId)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Records an audit log entry for an administrative action.
   */
  public static async logAdminAction(
    adminId: string,
    action: AdminActionType,
    targetType: string,
    targetId: string,
    details: Record<string, unknown> = {},
  ) {
    return prisma.adminAction.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details as any,
      },
    });
  }

  /**
   * Aggregates key metrics for the administrator dashboard.
   */
  public static async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      bannedUsers,
      activeToday,
      totalGames,
      activeGames,
      gamesToday,
      pendingReports,
      totalWalletCirculation,
    ] = await Promise.all([
      prisma.user.count({ where: { isBot: false } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.session.count({
        where: {
          lastActiveAt: { gte: today },
        },
      }),
      prisma.game.count(),
      prisma.game.count({ where: { status: GameStatus.IN_PROGRESS } }),
      prisma.game.count({ where: { startedAt: { gte: today } } }),
      prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        banned: bannedUsers,
        activeToday,
      },
      games: {
        total: totalGames,
        active: activeGames,
        today: gamesToday,
      },
      moderation: {
        pendingReports,
      },
      economy: {
        tokenCirculation: totalWalletCirculation._sum.balance ?? 0,
      },
    };
  }

  /**
   * Searches and filters users with pagination.
   */
  public static async searchUsers(options: AdminUserFilterOptions = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (options.role) {
      where.role = options.role;
    }

    if (typeof options.isBanned === 'boolean') {
      where.isBanned = options.isBanned;
    }

    if (options.search) {
      const term = options.search;
      where.OR = [
        { id: term },
        { username: { contains: term, mode: 'insensitive' } },
        { displayName: { contains: term, mode: 'insensitive' } },
        {
          telegramAccount: {
            OR: [
              { telegramId: term },
              { username: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          telegramAccount: true,
          wallet: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Retrieves paginated admin audit logs.
   */
  public static async getAuditLog(page = 1, limit = 20, targetType?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.AdminActionWhereInput = targetType ? { targetType } : {};

    const [logs, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              displayName: true,
              username: true,
              role: true,
            },
          },
        },
      }),
      prisma.adminAction.count({ where }),
    ]);

    return {
      items: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Updates or creates a system setting and logs action.
   */
  public static async updateSystemSetting(
    key: string,
    value: string,
    adminId: string,
    description = '',
  ) {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description: description || undefined,
        updatedBy: adminId,
      },
      create: {
        key,
        value,
        description,
        updatedBy: adminId,
      },
    });

    await this.logAdminAction(adminId, AdminActionType.UPDATE_SYSTEM_SETTING, 'SETTING', key, {
      value,
    });

    return setting;
  }

  /**
   * Toggles a feature flag and logs action.
   */
  public static async toggleFeatureFlag(
    key: string,
    enabled: boolean,
    adminId: string,
    description = '',
  ) {
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: {
        enabled,
        updatedBy: adminId,
      },
      create: {
        key,
        enabled,
        description,
        updatedBy: adminId,
      },
    });

    await this.logAdminAction(adminId, AdminActionType.TOGGLE_FEATURE_FLAG, 'FEATURE_FLAG', key, {
      enabled,
    });

    return flag;
  }

  /**
   * Resolves or rejects user reports.
   */
  public static async resolveReport(
    reportId: string,
    resolverId: string,
    status: ReportStatus,
    actionNote?: string,
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundError(`Report ${reportId} not found`);
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedBy: resolverId,
        resolvedAt: new Date(),
      },
    });

    await this.logAdminAction(resolverId, AdminActionType.RESOLVE_REPORT, 'REPORT', reportId, {
      status,
      actionNote,
    });

    return updated;
  }
}

export default AdminService;
