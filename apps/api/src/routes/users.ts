import type { FastifyPluginAsync } from 'fastify';
import { updateProfileSchema, gameListQuerySchema } from '@shashka/validation';
import type { ApiResponse, UserStatsResponse } from '@shashka/shared-types';
import { prisma } from '@shashka/database';
import { UserService } from '../services/user.service.js';
import { GameService } from '../services/game.service.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { activeOnlineUsers } from '../plugins/socket.js';
import { WalletService } from '../services/wallet.service.js';
import { WalletTransactionType } from '@shashka/shared-types';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/users/online
  fastify.get('/online', async (_req, reply) => {
    return reply.send({
      success: true,
      data: Array.from(activeOnlineUsers.values()),
    });
  });

  // GET /api/users/all-players (All platform players with status: online, in_game, offline)
  fastify.get('/all-players', async (_req, reply) => {
    try {
      const dbUsers = await prisma.user.findMany({
        where: { isBanned: false },
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          rating: true,
          role: true,
          createdAt: true,
        },
        orderBy: { rating: 'desc' },
        take: 50,
      });

      const onlineMap = new Map<string, any>();
      for (const onlineUser of activeOnlineUsers.values()) {
        onlineMap.set(onlineUser.id, onlineUser);
      }

      const allPlayers = dbUsers.map((u: any) => {
        const live = onlineMap.get(u.id);
        const status = live ? (live.status || 'online') : 'offline';
        const currentGameId = live?.currentGameId || null;

        return {
          id: u.id,
          displayName: u.displayName,
          username: u.username,
          avatarUrl: u.avatarUrl,
          rating: u.rating ?? 0,
          role: u.role,
          status, // 'in_game' | 'online' | 'offline'
          currentGameId,
          connectedAt: live?.connectedAt || null,
        };
      });

      // Sort: in_game and online first, then offline
      allPlayers.sort((a: any, b: any) => {
        const priority = (s: string) => (s === 'in_game' ? 2 : s === 'online' ? 1 : 0);
        const diff = priority(b.status) - priority(a.status);
        if (diff !== 0) return diff;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });

      return reply.send({
        success: true,
        data: allPlayers,
      });
    } catch (err: any) {
      return reply.send({
        success: true,
        data: [],
      });
    }
  });

  // GET /api/users/me
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const user = await UserService.getUserById(authUser.id);
      const stats = await UserService.getUserStats(authUser.id);

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            language: user.language,
            role: user.role,
            rating: user.rating,
            createdAt: user.createdAt.toISOString(),
          },
          stats,
        },
      };

      return reply.send(response);
    },
  );

  // PATCH /api/users/me
  fastify.patch(
    '/me',
    {
      preHandler: [authenticate, validateBody(updateProfileSchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const body = req.body as any;

      const updated = await UserService.updateProfile(authUser.id, {
        displayName: body.displayName,
        avatarUrl: body.avatarUrl,
        language: body.language,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          id: updated.id,
          username: updated.username,
          displayName: updated.displayName,
          avatarUrl: updated.avatarUrl,
          language: updated.language,
          role: updated.role,
          rating: updated.rating,
        },
      };

      return reply.send(response);
    },
  );

  // GET /api/users/:id
  fastify.get('/:id', { preHandler: [optionalAuthenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = await UserService.getUserById(id);

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        rating: user.rating,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };

    return reply.send(response);
  });

  // GET /api/users/:id/stats
  fastify.get('/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string };
    const stats = await UserService.getUserStats(id);

    const response: ApiResponse<UserStatsResponse> = {
      success: true,
      data: stats,
    };

    return reply.send(response);
  });

  // GET /api/users/:id/games
  fastify.get(
    '/:id/games',
    {
      preHandler: [validateQuery(gameListQuerySchema)],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const query = req.query as any;
      const page = query?.page || 1;
      const limit = query?.limit || 20;

      const history = await GameService.getUserGameHistory(id, page, limit);

      const response: ApiResponse = {
        success: true,
        data: history,
      };

      return reply.send(response);
    },
  );

  // POST /api/users/roll-dice
  fastify.post(
    '/roll-dice',
    {
      preHandler: [optionalAuthenticate],
    },
    async (req, reply) => {
      const authUser = req.user;
      const body = (req.body as any) || {};
      const userId = authUser?.id || body?.userId;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Foydalanuvchi aniqlanmadi' },
        });
      }

      const bet = Math.max(10, Math.min(1000, Number(body?.bet) || 50));

      // 1. Debit bet amount
      try {
        await WalletService.debit(
          userId,
          bet,
          WalletTransactionType.GAME_ENTRY_FEE,
          `Zarik o'yini uchun to'lov (${bet} tanga)`,
        );
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { message: `Tangangiz yetarli emas! Zar tashlash uchun kamida ${bet} tanga kerak.` },
        });
      }

      // 2. Roll dice (1 to 6)
      const diceNumber = Math.floor(Math.random() * 6) + 1;
      const multipliers: Record<number, number> = {
        1: 0.5,
        2: 0.8,
        3: 1.2,
        4: 1.8,
        5: 2.5,
        6: 5.0,
      };
      const multiplier = multipliers[diceNumber] || 1;
      const reward = Math.round(bet * multiplier);

      if (reward > 0) {
        await WalletService.credit(
          userId,
          reward,
          WalletTransactionType.GAME_REWARD,
          `Zarik yutug'i (${diceNumber} raqami, ${multiplier}x: +${reward} tanga)`,
        );
      }

      const newBalance = await WalletService.getBalance(userId);

      return reply.send({
        success: true,
        data: {
          diceNumber,
          multiplier,
          bet,
          reward,
          netProfit: reward - bet,
          newBalance,
        },
      });
    },
  );
};

export default userRoutes;
