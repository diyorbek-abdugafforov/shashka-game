import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { gameListQuerySchema, timeControlSchema } from '@shashka/validation';
import type { ApiResponse } from '@shashka/shared-types';
import { prisma } from '@shashka/database';
import { GameService } from '../services/game.service.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

const createBotGameSchema = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  timeControl: timeControlSchema.optional(),
});

const createOfflineGameSchema = z.object({
  timeControl: timeControlSchema.optional(),
});

export const gameRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/games/bot
  fastify.post(
    '/bot',
    {
      preHandler: [authenticate, validateBody(createBotGameSchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const body = req.body as z.infer<typeof createBotGameSchema>;

      const game = await GameService.createBotGame(
        authUser.id,
        body.difficulty,
        body.timeControl,
      );

      const response: ApiResponse = {
        success: true,
        data: game,
      };

      return reply.status(201).send(response);
    },
  );

  // POST /api/games/invite
  fastify.post(
    '/invite',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const body = (req.body as any) || {};
      const mode = body.mode || 'CLASSIC';
      const timeControl = body.timeControl || { initialSeconds: 90, incrementSeconds: 2 };

      const game = await GameService.createInviteGame(authUser.id, mode, timeControl);

      const response: ApiResponse = {
        success: true,
        data: game,
      };

      return reply.status(201).send(response);
    },
  );

  // POST /api/games/:id/join
  fastify.post(
    '/:id/join',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const { id } = req.params as { id: string };

      const game = await GameService.joinInviteGame(id, authUser.id);

      const response: ApiResponse = {
        success: true,
        data: game,
      };

      return reply.send(response);
    },
  );

  // POST /api/games/offline
  fastify.post(
    '/offline',
    {
      preHandler: [authenticate, validateBody(createOfflineGameSchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const body = req.body as z.infer<typeof createOfflineGameSchema>;

      const game = await GameService.createOfflineGame(authUser.id, body.timeControl);

      const response: ApiResponse = {
        success: true,
        data: game,
      };

      return reply.status(201).send(response);
    },
  );

  // POST /api/games/record-completed
  fastify.post(
    '/record-completed',
    {
      preHandler: [optionalAuthenticate],
    },
    async (req, reply) => {
      const authUser = req.user;
      const body = req.body as any;
      const userId = authUser?.id || body?.userId;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Foydalanuvchi aniqlanmadi (userId talab qilinadi)' },
        });
      }

      const game = await GameService.recordCompletedGame(userId, {
        mode: body.mode || 'BOT',
        difficulty: body.difficulty || 'MEDIUM',
        result: body.result,
        reason: body.reason,
        moves: body.moves || [],
      });

      const response: ApiResponse = {
        success: true,
        data: game,
      };

      return reply.status(201).send(response);
    },
  );

  // GET /api/games/history
  fastify.get(
    '/history',
    {
      preHandler: [authenticate, validateQuery(gameListQuerySchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const query = req.query as any;
      const page = query?.page || 1;
      const limit = query?.limit || 20;

      const history = await GameService.getUserGameHistory(authUser.id, page, limit);

      const response: ApiResponse = {
        success: true,
        data: history,
      };

      return reply.send(response);
    },
  );

  // GET /api/games/my (alias for /history)
  fastify.get(
    '/my',
    {
      preHandler: [authenticate, validateQuery(gameListQuerySchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const query = req.query as any;
      const page = query?.page || 1;
      const limit = query?.limit || 20;

      const history = await GameService.getUserGameHistory(authUser.id, page, limit);

      const response: ApiResponse = {
        success: true,
        data: history,
      };

      return reply.send(response);
    },
  );

  // GET /api/games/:id
  fastify.get('/:id', { preHandler: [optionalAuthenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const game = await GameService.getGame(id);
    const moves = await GameService.getGameMoves(id);

    const deserialized = GameService.deserializeBoard(game.boardState);
    const serialized = GameService.serializeBoard(deserialized);

    const response: ApiResponse = {
      success: true,
      data: {
        game: {
          ...game,
          boardState: serialized,
        },
        moves,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
      },
    };

    return reply.send(response);
  });

  // GET /api/games/:id/moves
  fastify.get('/:id/moves', async (req, reply) => {
    const { id } = req.params as { id: string };
    const moves = await GameService.getGameMoves(id);

    const response: ApiResponse = {
      success: true,
      data: moves,
    };

    return reply.send(response);
  });

  // GET /api/games/featured-weekly
  fastify.get('/featured-weekly', async (_req, reply) => {
    try {
      const games = await prisma.game.findMany({
        where: {
          status: 'FINISHED',
        },
        orderBy: [
          { startedAt: 'desc' },
        ],
        take: 20,
        include: {
          whitePlayer: {
            select: { id: true, displayName: true, username: true, avatarUrl: true, rating: true },
          },
          blackPlayer: {
            select: { id: true, displayName: true, username: true, avatarUrl: true, rating: true },
          },
        },
      });

      // Fetch reviews/ratings for these games
      const gameIds = games.map((g: any) => g.id);
      const reviews = await prisma.gameReview.findMany({
        where: { gameId: { in: gameIds } },
      });

      const enriched = games.map((g: any) => {
        const gameReviews = reviews.filter((r: any) => r.gameId === g.id);
        const avgRating = gameReviews.length
          ? Number((gameReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / gameReviews.length).toFixed(1))
          : 5.0;

        return {
          id: g.id,
          mode: g.mode,
          result: g.result,
          resultReason: g.resultReason,
          moveCount: g.moveCount,
          startedAt: g.startedAt,
          finishedAt: g.finishedAt,
          whitePlayer: g.whitePlayer,
          blackPlayer: g.blackPlayer,
          rating: avgRating,
          reviewCount: gameReviews.length,
          badge: g.moveCount < 20 ? "Tezkor mot" : g.moveCount > 40 ? "Shiddatli jang" : "Oltin partiya",
        };
      });

      return reply.send({
        success: true,
        data: enriched,
      });
    } catch (err: any) {
      return reply.send({
        success: true,
        data: [],
      });
    }
  });

  // POST /api/games/:id/rate
  fastify.post('/:id/rate', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const authUser = req.user!;
    const body = (req.body as any) || {};
    const stars = Math.min(5, Math.max(1, parseInt(body.stars || body.rating || 5, 10)));
    const comment = body.comment || null;

    try {
      const review = await prisma.gameReview.upsert({
        where: {
          gameId_userId: {
            gameId: id,
            userId: authUser.id,
          },
        },
        update: {
          rating: stars,
          comment,
        },
        create: {
          gameId: id,
          userId: authUser.id,
          rating: stars,
          comment,
        },
      });

      return reply.send({
        success: true,
        data: review,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { message: err.message || 'Baholashda xatolik yuz berdi' },
      });
    }
  });
};

export default gameRoutes;
