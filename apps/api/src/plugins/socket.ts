import type { FastifyPluginAsync } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import prisma from '@shashka/database';
import { getConfig } from '../config.js';
import type { AuthenticatedSocket, JwtTokenPayload } from '../types.js';
import { registerGameHandlers } from '../ws/game-handler.js';
import { registerMatchmakingHandlers } from '../ws/matchmaking-handler.js';
import { GameService } from '../services/game.service.js';
import { GameMode, PlayerColor } from '@shashka/shared-types';

export interface ActiveOnlineUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  rating: number;
  socketId: string;
  connectedAt: number;
}

export const activeOnlineUsers = new Map<string, ActiveOnlineUser>();

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

export const socketPlugin: FastifyPluginAsync = async (fastify) => {
  const config = getConfig();

  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: config.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Attempt to configure Redis Adapter for horizontal scaling (production or if explicitly enabled)
  const isRedisEnabled = process.env.USE_REDIS === 'true' || (process.env.NODE_ENV === 'production' && Boolean(config.REDIS_URL));

  if (isRedisEnabled) {
    try {
      const pubClient = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      const subClient = pubClient.duplicate();

      pubClient.on('error', () => {});
      subClient.on('error', () => {});

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          fastify.log.info('Socket.IO Redis adapter enabled for horizontal clustering');
        })
        .catch(() => {
          fastify.log.info('Redis offline, Socket.IO using local memory adapter');
        });
    } catch {
      fastify.log.info('Socket.IO using local memory adapter');
    }
  } else {
    fastify.log.info('Socket.IO running in local memory adapter mode');
  }

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      const fallbackUser = socket.handshake.auth?.user;

      if (!token) {
        if (fallbackUser && fallbackUser.id) {
          (socket as AuthenticatedSocket).data = {
            user: {
              id: fallbackUser.id,
              telegramId: fallbackUser.telegramId || undefined,
              username: fallbackUser.username || null,
              displayName: fallbackUser.displayName || 'O\'yinchi',
              role: fallbackUser.role || 'USER',
              isBanned: false,
              avatarUrl: fallbackUser.avatarUrl || null,
            },
          };
          return next();
        }
        return next(new Error('Authentication token required'));
      }

      try {
        const payload = jwt.verify(token, config.JWT_SECRET) as JwtTokenPayload;
        if (payload?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { telegramAccount: true },
          });

          if (user) {
            if (user.isBanned) {
              return next(new Error('User account is banned'));
            }

            (socket as AuthenticatedSocket).data = {
              user: {
                id: user.id,
                telegramId: user.telegramAccount?.telegramId,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                isBanned: user.isBanned,
                avatarUrl: user.avatarUrl,
              },
            };
            return next();
          }
        }
      } catch {
        // Token invalid, check fallback user
        if (fallbackUser && fallbackUser.id) {
          (socket as AuthenticatedSocket).data = {
            user: {
              id: fallbackUser.id,
              telegramId: fallbackUser.telegramId || undefined,
              username: fallbackUser.username || null,
              displayName: fallbackUser.displayName || 'O\'yinchi',
              role: fallbackUser.role || 'USER',
              isBanned: false,
              avatarUrl: fallbackUser.avatarUrl || null,
            },
          };
          return next();
        }
      }

      next(new Error('Unauthorized: Invalid session'));
    } catch (err: any) {
      next(new Error(err.message || 'Unauthorized'));
    }
  });

  // Client connection handler
  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    fastify.log.info({ userId: user.id }, 'Authenticated WebSocket client connected');

    // Join personal user notification room
    socket.join(`user:${user.id}`);

    // Register into active online users list
    activeOnlineUsers.set(user.id, {
      id: user.id,
      displayName: user.displayName,
      username: user.username || null,
      avatarUrl: user.avatarUrl || null,
      rating: (user as any).rating || 1200,
      socketId: socket.id,
      connectedAt: Date.now(),
    });

    // Broadcast live active users to all clients
    io.emit('users:online', Array.from(activeOnlineUsers.values()));

    // Allow client to request fresh list
    socket.on('users:get_online', () => {
      socket.emit('users:online', Array.from(activeOnlineUsers.values()));
    });

    // 1. Direct game challenge: User A -> User B
    socket.on('challenge:send', (payload: { targetUserId: string; mode?: GameMode }) => {
      const targetUserId = payload.targetUserId;
      if (!targetUserId || targetUserId === user.id) return;

      const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      fastify.log.info({ from: user.id, to: targetUserId }, 'Direct game challenge sent');

      const challengePayload = {
        challengeId,
        fromUser: {
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          rating: (user as any).rating || 1200,
        },
        mode: payload.mode || GameMode.CLASSIC,
      };

      io.to(`user:${targetUserId}`).emit('challenge:received', challengePayload);
      const targetOnlineUser = activeOnlineUsers.get(targetUserId);
      if (targetOnlineUser?.socketId) {
        io.to(targetOnlineUser.socketId).emit('challenge:received', challengePayload);
      }
    });

    // 2. Accept challenge: User B accepts -> create game and notify both
    socket.on('challenge:accept', async (payload: { challengeId: string; fromUserId: string; mode?: GameMode }) => {
      try {
        const fromUserId = payload.fromUserId;
        fastify.log.info({ acceptedBy: user.id, fromUser: fromUserId }, 'Direct challenge accepted');

        const game = await GameService.createDirectChallengeGame(
          fromUserId,
          user.id,
          payload.mode || GameMode.CLASSIC,
        );

        // Fetch opponent display name
        const fromUserRecord = await prisma.user.findUnique({ where: { id: fromUserId } });
        const fromSocketUser = activeOnlineUsers.get(fromUserId);
        const toSocketUser = activeOnlineUsers.get(user.id);

        const matchedPayload1 = {
          gameId: game.id,
          color: PlayerColor.WHITE,
          opponent: {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            rating: (user as any).rating || 1200,
          },
        };

        const matchedPayload2 = {
          gameId: game.id,
          color: PlayerColor.BLACK,
          opponent: {
            id: fromUserId,
            displayName: fromUserRecord?.displayName || 'Raqib',
            avatarUrl: fromUserRecord?.avatarUrl || null,
            rating: fromUserRecord?.rating || 1200,
          },
        };

        // Notify Player 1 (White) both via user room and direct socket
        io.to(`user:${fromUserId}`).emit('challenge:matched', matchedPayload1);
        if (fromSocketUser?.socketId) {
          io.to(fromSocketUser.socketId).emit('challenge:matched', matchedPayload1);
        }

        // Notify Player 2 (Black) both via user room and directly on this socket!
        io.to(`user:${user.id}`).emit('challenge:matched', matchedPayload2);
        socket.emit('challenge:matched', matchedPayload2);
        if (toSocketUser?.socketId && toSocketUser.socketId !== socket.id) {
          io.to(toSocketUser.socketId).emit('challenge:matched', matchedPayload2);
        }
      } catch (err: any) {
        fastify.log.error({ err }, 'Failed to accept direct challenge');
        socket.emit('error', { message: 'O\'yinni boshlashda xatolik yuz berdi' });
      }
    });

    // 3. Decline challenge: User B declines -> notify User A
    socket.on('challenge:decline', (payload: { challengeId: string; fromUserId: string }) => {
      const fromUserId = payload.fromUserId;
      fastify.log.info({ declinedBy: user.id, fromUser: fromUserId }, 'Direct challenge declined');

      io.to(`user:${fromUserId}`).emit('challenge:declined', {
        challengeId: payload.challengeId,
        byUser: {
          id: user.id,
          displayName: user.displayName,
        },
      });
    });

    // 4. Cancel challenge: User A cancels while waiting
    socket.on('challenge:cancel', (payload: { targetUserId: string }) => {
      io.to(`user:${payload.targetUserId}`).emit('challenge:cancelled', {
        fromUserId: user.id,
      });
    });

    // Register existing handlers
    registerGameHandlers(io, socket);
    registerMatchmakingHandlers(io, socket);

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', (reason) => {
      fastify.log.info({ userId: user.id, reason }, 'WebSocket client disconnected');
      
      const current = activeOnlineUsers.get(user.id);
      if (current && current.socketId === socket.id) {
        activeOnlineUsers.delete(user.id);
        io.emit('users:online', Array.from(activeOnlineUsers.values()));
      }
    });
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing Socket.IO server...');
    io.close();
  });
};

export default socketPlugin;
