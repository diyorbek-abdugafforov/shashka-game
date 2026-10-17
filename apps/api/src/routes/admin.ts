import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import prisma from '@shashka/database';
import {
  adminUserFilterSchema,
  adminResolveReportSchema,
} from '@shashka/validation';
import {
  AdminActionType,
  ReportStatus,
  WalletTransactionType,
  type ApiResponse,
} from '@shashka/shared-types';
import { requireAdmin } from '../middleware/admin.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { AdminService } from '../services/admin.service.js';
import { UserService } from '../services/user.service.js';
import { GameService } from '../services/game.service.js';
import { WalletService } from '../services/wallet.service.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply admin authorization check
  fastify.addHook('preHandler', requireAdmin);

  // GET /api/admin/dashboard
  fastify.get('/dashboard', async (_req, reply) => {
    const stats = await AdminService.getDashboardStats();

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    return reply.send(response);
  });

  // GET /api/admin/users
  fastify.get(
    '/users',
    {
      preHandler: [validateQuery(adminUserFilterSchema)],
    },
    async (req, reply) => {
      const query = req.query as any;
      const result = await AdminService.searchUsers(query);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      return reply.send(response);
    },
  );

  // GET /api/admin/users/:id
  fastify.get('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = await UserService.getUserById(id);
    const stats = await UserService.getUserStats(id);
    const balance = await WalletService.getBalance(id);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        stats,
        walletBalance: balance,
      },
    };

    return reply.send(response);
  });

  // POST /api/admin/users/:id/ban
  fastify.post(
    '/users/:id/ban',
    {
      preHandler: [validateBody(z.object({
        reason: z.string().min(3),
        bannedUntil: z.string().datetime().optional().nullable(),
      }))],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as { reason: string; bannedUntil?: string | null };
      const adminId = req.user!.id;

      const bannedUntilDate = body.bannedUntil ? new Date(body.bannedUntil) : null;
      const bannedUser = await UserService.banUser(id, adminId, body.reason, bannedUntilDate);

      const response: ApiResponse = {
        success: true,
        data: bannedUser,
      };

      return reply.send(response);
    },
  );

  // POST /api/admin/users/:id/unban
  fastify.post(
    '/users/:id/unban',
    {
      preHandler: [validateBody(z.object({
        reason: z.string().optional(),
      }))],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = (req.body as { reason?: string }) || {};
      const adminId = req.user!.id;

      const unbannedUser = await UserService.unbanUser(id, adminId, body.reason);

      const response: ApiResponse = {
        success: true,
        data: unbannedUser,
      };

      return reply.send(response);
    },
  );

  // GET /api/admin/reports
  fastify.get('/reports', async (req, reply) => {
    const query = req.query as any;
    const page = parseInt(query?.page || '1', 10);
    const limit = parseInt(query?.limit || '20', 10);
    const status = query?.status as ReportStatus | undefined;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reporter: {
            select: { id: true, displayName: true, username: true },
          },
          reportedUser: {
            select: { id: true, displayName: true, username: true },
          },
          reportedGame: {
            select: { id: true, mode: true, status: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        items: reports,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    return reply.send(response);
  });

  // PATCH /api/admin/reports/:id
  fastify.patch(
    '/reports/:id',
    {
      preHandler: [validateBody(adminResolveReportSchema.omit({ reportId: true }))],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as any;
      const adminId = req.user!.id;

      const resolved = await AdminService.resolveReport(
        id,
        adminId,
        body.status,
        body.actionNote,
      );

      const response: ApiResponse = {
        success: true,
        data: resolved,
      };

      return reply.send(response);
    },
  );

  // GET /api/admin/games/:id
  fastify.get('/games/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const game = await GameService.getGame(id);
    const moves = await GameService.getGameMoves(id);

    const response: ApiResponse = {
      success: true,
      data: {
        game: {
          ...game,
          boardState: GameService.deserializeBoard(game.boardState),
        },
        moves,
      },
    };

    return reply.send(response);
  });

  // POST /api/admin/wallet/:userId/adjust
  fastify.post(
    '/wallet/:userId/adjust',
    {
      preHandler: [validateBody(z.object({
        amount: z.number().int().refine((n) => n !== 0, 'Amount cannot be zero'),
        reason: z.string().min(3),
      }))],
    },
    async (req, reply) => {
      const { userId } = req.params as { userId: string };
      const { amount, reason } = req.body as { amount: number; reason: string };
      const adminId = req.user!.id;

      let result;
      if (amount > 0) {
        result = await WalletService.credit(
          userId,
          amount,
          WalletTransactionType.ADMIN_ADJUSTMENT,
          reason,
          adminId,
          'ADMIN',
        );
      } else {
        result = await WalletService.debit(
          userId,
          Math.abs(amount),
          WalletTransactionType.ADMIN_ADJUSTMENT,
          reason,
          adminId,
          'ADMIN',
        );
      }

      await AdminService.logAdminAction(
        adminId,
        AdminActionType.UPDATE_WALLET_BALANCE,
        'USER',
        userId,
        { amount, reason },
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      return reply.send(response);
    },
  );

  // GET /api/admin/settings
  fastify.get('/settings', async (_req, reply) => {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const response: ApiResponse = {
      success: true,
      data: settings,
    };

    return reply.send(response);
  });

  // PATCH /api/admin/settings/:key
  fastify.patch(
    '/settings/:key',
    {
      preHandler: [validateBody(z.object({
        value: z.string().min(1),
        description: z.string().optional(),
      }))],
    },
    async (req, reply) => {
      const { key } = req.params as { key: string };
      const { value, description } = req.body as { value: string; description?: string };
      const adminId = req.user!.id;

      const setting = await AdminService.updateSystemSetting(
        key,
        value,
        adminId,
        description,
      );

      const response: ApiResponse = {
        success: true,
        data: setting,
      };

      return reply.send(response);
    },
  );

  // GET /api/admin/feature-flags
  fastify.get('/feature-flags', async (_req, reply) => {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });

    const response: ApiResponse = {
      success: true,
      data: flags,
    };

    return reply.send(response);
  });

  // PATCH /api/admin/feature-flags/:key
  fastify.patch(
    '/feature-flags/:key',
    {
      preHandler: [validateBody(z.object({
        enabled: z.boolean(),
        description: z.string().optional(),
      }))],
    },
    async (req, reply) => {
      const { key } = req.params as { key: string };
      const { enabled, description } = req.body as { enabled: boolean; description?: string };
      const adminId = req.user!.id;

      const flag = await AdminService.toggleFeatureFlag(
        key,
        enabled,
        adminId,
        description,
      );

      const response: ApiResponse = {
        success: true,
        data: flag,
      };

      return reply.send(response);
    },
  );

  // GET /api/admin/audit-log
  fastify.get('/audit-log', async (req, reply) => {
    const query = req.query as any;
    const page = parseInt(query?.page || '1', 10);
    const limit = parseInt(query?.limit || '20', 10);
    const targetType = query?.targetType as string | undefined;

    const logs = await AdminService.getAuditLog(page, limit, targetType);

    const response: ApiResponse = {
      success: true,
      data: logs,
    };

    return reply.send(response);
  });
};

export default adminRoutes;
