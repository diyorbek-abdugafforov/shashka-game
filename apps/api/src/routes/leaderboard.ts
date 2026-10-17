import type { FastifyPluginAsync } from 'fastify';
import prisma from '@shashka/database';
import { leaderboardQuerySchema } from '@shashka/validation';
import { GameMode, type ApiResponse, type LeaderboardEntry } from '@shashka/shared-types';
import { MatchmakingService } from '../services/matchmaking.service.js';
import { validateQuery } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';
import { UserService } from '../services/user.service.js';

export const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/leaderboard
  fastify.get(
    '/',
    {
      preHandler: [validateQuery(leaderboardQuerySchema)],
    },
    async (req, reply) => {
      const query = req.query as any;
      const limit = Math.min(query?.limit || 50, 100);
      const mode = query?.mode || GameMode.CLASSIC;

      const redis = MatchmakingService.getRedis();
      const cacheKey = `leaderboard:${mode}:${limit}`;

      if (redis && redis.status === 'ready') {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return reply.send({
            success: true,
            data: JSON.parse(cached),
            meta: { cached: true },
          });
        }
      }

      // Fetch top rated players
      const topUsers = await prisma.user.findMany({
        where: {
          isBot: false,
          isBanned: false,
        },
        orderBy: { rating: 'desc' },
        take: limit,
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          rating: true,
        },
      });

      // Gather stats for top players
      const entries: LeaderboardEntry[] = await Promise.all(
        topUsers.map(async (u, idx) => {
          const stats = await UserService.getUserStats(u.id);
          return {
            rank: idx + 1,
            userId: u.id,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            rating: u.rating,
            gamesPlayed: stats.gamesPlayed,
            winRate: stats.winRate,
          };
        }),
      );

      const result = {
        mode,
        topPlayers: entries,
      };

      if (redis && redis.status === 'ready') {
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
      }

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      return reply.send(response);
    },
  );

  // GET /api/leaderboard/position/:userId
  fastify.get('/position/:userId', async (req, reply) => {
    const { userId } = req.params as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        rating: true,
      },
    });

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    const higherRatedCount = await prisma.user.count({
      where: {
        isBot: false,
        isBanned: false,
        rating: { gt: user.rating },
      },
    });

    const stats = await UserService.getUserStats(userId);

    const entry: LeaderboardEntry = {
      rank: higherRatedCount + 1,
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      rating: user.rating,
      gamesPlayed: stats.gamesPlayed,
      winRate: stats.winRate,
    };

    const response: ApiResponse = {
      success: true,
      data: entry,
    };

    return reply.send(response);
  });
};

export default leaderboardRoutes;
