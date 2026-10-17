import { Bot, session, GrammyError, HttpError } from 'grammy';
import { Redis, type Redis as RedisClient } from 'ioredis';
import { RedisAdapter } from '@grammyjs/storage-redis';
import type { BotContext, BotSession } from './types.js';
import { getBotConfig } from './config.js';
import { logger } from './utils/logger.js';
import { createRateLimitMiddleware } from './middleware/rate-limit.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createBannedMiddleware } from './middleware/banned.js';
import { createLanguageMiddleware } from './middleware/language.js';
import { mainMenu } from './menus/main-menu.js';
import { settingsMenu } from './menus/settings-menu.js';
import { handleStartCommand } from './commands/start.js';
import { handleHelpCommand } from './commands/help.js';
import { handleSettingsCommand } from './commands/settings.js';
import { handleStatsCommand } from './commands/stats.js';
import { handleBroadcastCommand } from './commands/broadcast.js';
import { handleCallbackQueries } from './handlers/callbacks.js';

export function initialSession(): BotSession {
  return {
    language: 'uz',
    notificationsEnabled: true,
  };
}

export function createBot(): { bot: Bot<BotContext>; redisClient: RedisClient | null } {
  const config = getBotConfig();

  const bot = new Bot<BotContext>(config.TELEGRAM_BOT_TOKEN);

  // 1. Session Storage Setup
  let redisClient: RedisClient | null = null;
  let sessionMiddleware;

  const isRedisEnabled = process.env.USE_REDIS === 'true' || (config.NODE_ENV === 'production' && Boolean(config.REDIS_URL));

  if (isRedisEnabled) {
    try {
      redisClient = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });

      redisClient.on('error', () => {
        // Silently ignore Redis error if connection drops
      });

      const storage = new RedisAdapter<BotSession>({ instance: redisClient, ttl: 86400 * 30 });
      sessionMiddleware = session({
        initial: initialSession,
        storage,
      });
      logger.info('Bot initialized with Redis session storage');
    } catch {
      sessionMiddleware = session({
        initial: initialSession,
      });
    }
  } else {
    // Development mode default: fast & reliable in-memory session
    sessionMiddleware = session({
      initial: initialSession,
    });
    logger.info('Bot initialized with in-memory session storage');
  }

  bot.use(sessionMiddleware);

  // 2. Middlewares Pipeline
  bot.use(createRateLimitMiddleware({ windowMs: 60000, maxRequests: 40 }));
  bot.use(createAuthMiddleware());
  bot.use(createBannedMiddleware());
  bot.use(createLanguageMiddleware());

  // 3. Menus (Must be registered before commands and callback queries)
  bot.use(mainMenu);
  bot.use(settingsMenu);

  // 4. Command Handlers
  bot.command('start', handleStartCommand);
  bot.command('help', handleHelpCommand);
  bot.command('settings', handleSettingsCommand);
  bot.command('stats', handleStatsCommand);
  bot.command('broadcast', handleBroadcastCommand);

  // 5. Callback Query Handlers
  bot.on('callback_query:data', handleCallbackQueries);

  // 6. Error Handling
  bot.catch((err) => {
    const ctx = err.ctx;
    const error = err.error;

    logger.error(
      {
        updateId: ctx.update.update_id,
        userId: ctx.from?.id,
        err: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Unhandled error in grammY update processing',
    );

    if (error instanceof GrammyError) {
      // Telegram API error (e.g. user blocked bot, message not modified)
      logger.warn(
        { errorCode: error.error_code, description: error.description },
        'Telegram API error occurred',
      );
    } else if (error instanceof HttpError) {
      logger.error({ err: error }, 'Network/HTTP error occurred while calling Telegram API');
    }
  });

  return { bot, redisClient };
}
