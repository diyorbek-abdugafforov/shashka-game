import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '@shashka/database';
import { getConfig, isDev, isProd } from './config.js';
import { logger } from './utils/logger.js';
import { handleApiError } from './utils/errors.js';
import { authPlugin } from './plugins/auth.js';
import { socketPlugin } from './plugins/socket.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { gameRoutes } from './routes/games.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { shopRoutes } from './routes/shop.js';
import { adminRoutes } from './routes/admin.js';

let redisClient: Redis | null = null;
let gameEventQueue: Queue | null = null;

async function bootstrap() {
  const config = getConfig();

  const server = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
  });

  // Custom global error handler
  server.setErrorHandler((error, request, reply) => {
    handleApiError(error, request, reply);
  });

  // Security headers with Helmet
  await server.register(helmet, {
    contentSecurityPolicy: isProd() ? undefined : false,
    crossOriginEmbedderPolicy: false,
  });

  // CORS configuration
  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin || isDev() || config.CORS_ORIGINS.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });

  // Cookie plugin
  await server.register(cookie, {
    secret: config.SESSION_SECRET,
  });

  // Rate Limiting
  await server.register(rateLimit, {
    max: isDev() ? 1000 : 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost'],
  });

  // OpenAPI / Swagger Documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Russian Checkers (Shashka) Game API',
        description: 'Production Fastify API server and Socket.IO engine for Russian Checkers platform',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Core Authentication Plugin
  await server.register(authPlugin);

  // Real-time Socket.IO Plugin
  await server.register(socketPlugin);

  // Initialize BullMQ Queue if Redis is available and enabled
  const isRedisEnabled = process.env.USE_REDIS === 'true' || (process.env.NODE_ENV === 'production' && Boolean(config.REDIS_URL));

  if (isRedisEnabled) {
    try {
      redisClient = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      redisClient.on('error', () => {});

      await redisClient.connect().then(() => {
        logger.info('Connected to Redis successfully');
        gameEventQueue = new Queue('game-background-events', {
          connection: redisClient as any,
        });
      }).catch(() => {
        logger.info('Redis not available; running without background queue');
      });
    } catch {
      logger.info('Redis initialization skipped');
    }
  }

  // Root endpoint
  server.get('/', async (_req, reply) => {
    return reply.send({
      name: 'Shashka Game API',
      status: 'online',
      version: '1.0.0',
      documentation: '/docs',
      miniApp: 'http://localhost:3000',
    });
  });

  // Healthcheck endpoint (verifies DB and Redis)
  server.get('/health', async (_req, reply) => {
    let dbStatus = 'down';
    let redisStatus = 'down';

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
    } catch {
      dbStatus = 'unhealthy';
    }

    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.ping();
        redisStatus = 'healthy';
      } catch {
        redisStatus = 'unhealthy';
      }
    } else {
      redisStatus = 'not_configured_or_offline';
    }

    const isHealthy = dbStatus === 'healthy';

    const healthData = {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'shashka-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
    };

    return reply.status(isHealthy ? 200 : 503).send(healthData);
  });

  // Register application routes
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(userRoutes, { prefix: '/api/users' });
  await server.register(gameRoutes, { prefix: '/api/games' });
  await server.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  await server.register(shopRoutes, { prefix: '/api/shop' });
  await server.register(adminRoutes, { prefix: '/api/admin' });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    try {
      if (gameEventQueue) {
        await gameEventQueue.close();
      }
      if (redisClient) {
        await redisClient.quit().catch(() => {});
      }
      await server.close();
      await prisma.$disconnect();
      logger.info('API server closed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Start listening
  try {
    await server.listen({ port: config.PORT, host: config.HOST });
    logger.info(`🚀 Shashka Game API listening at http://${config.HOST}:${config.PORT}`);
    logger.info(`📖 API Documentation available at http://${config.HOST}:${config.PORT}/docs`);
  } catch (err) {
    logger.fatal(err, 'Failed to start API server');
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
