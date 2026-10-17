import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@shashka/shared-types';
import { FriendService } from '../services/friend.service.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const addFriendSchema = z.object({
  friendId: z.string().uuid(),
});

export const friendRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/friends
  fastify.get(
    '/',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const friends = await FriendService.getFriends(authUser.id);

      const response: ApiResponse = {
        success: true,
        data: friends,
      };

      return reply.send(response);
    },
  );

  // POST /api/friends/add
  fastify.post(
    '/add',
    {
      preHandler: [authenticate, validateBody(addFriendSchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const { friendId } = req.body as z.infer<typeof addFriendSchema>;

      const added = await FriendService.addFriend(authUser.id, friendId);

      // Notify target user via socket if online
      if (fastify.io) {
        fastify.io.to(`user:${friendId}`).emit('friend:added', {
          byUser: {
            id: authUser.id,
            displayName: authUser.displayName,
            avatarUrl: authUser.avatarUrl,
          },
        });
      }

      const response: ApiResponse = {
        success: true,
        data: added,
      };

      return reply.send(response);
    },
  );

  // GET /api/friends/check/:friendId
  fastify.get(
    '/check/:friendId',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const { friendId } = req.params as { friendId: string };

      const isFriend = await FriendService.checkIsFriend(authUser.id, friendId);

      const response: ApiResponse = {
        success: true,
        data: { isFriend },
      };

      return reply.send(response);
    },
  );

  // DELETE /api/friends/:friendId
  fastify.delete(
    '/:friendId',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const { friendId } = req.params as { friendId: string };

      await FriendService.removeFriend(authUser.id, friendId);

      const response: ApiResponse = {
        success: true,
        data: { removed: true },
      };

      return reply.send(response);
    },
  );
};

export default friendRoutes;
