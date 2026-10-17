import type { FastifyPluginAsync } from 'fastify';
import { updateProfileSchema, gameListQuerySchema } from '@shashka/validation';
import type { ApiResponse, UserStatsResponse } from '@shashka/shared-types';
import { UserService } from '../services/user.service.js';
import { GameService } from '../services/game.service.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
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
};

export default userRoutes;
