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

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = jwt.verify(token, config.JWT_SECRET) as JwtTokenPayload;
      if (!payload.userId) {
        return next(new Error('Invalid token payload'));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { telegramAccount: true },
      });

      if (!user) {
        return next(new Error('User account not found'));
      }

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

      next();
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

    // Register handlers
    registerGameHandlers(io, socket);
    registerMatchmakingHandlers(io, socket);

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', (reason) => {
      fastify.log.info({ userId: user.id, reason }, 'WebSocket client disconnected');
    });
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Closing Socket.IO server...');
    io.close();
  });
};

export default socketPlugin;
