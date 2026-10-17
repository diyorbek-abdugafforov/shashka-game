import { prisma } from '@shashka/database';
import { getBotConfig, isProd } from './config.js';
import { logger } from './utils/logger.js';
import { createBot } from './bot.js';
import { createWebhookServer, type WebhookServerInstance } from './webhook.js';

let webhookServer: WebhookServerInstance | null = null;
let isShuttingDown = false;

async function bootstrap() {
  const config = getBotConfig();
  logger.info({ env: config.NODE_ENV }, 'Initializing Russian Checkers Telegram Bot...');

  const { bot, redisClient } = createBot();

  // Setup Graceful Shutdown Handler
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, 'Graceful shutdown initiated...');

    try {
      if (webhookServer) {
        await webhookServer.stop();
      } else {
        await bot.stop();
      }

      if (redisClient) {
        logger.info('Closing Redis connection...');
        await redisClient.quit().catch(() => {});
      }

      logger.info('Disconnecting Prisma database client...');
      await prisma.$disconnect();

      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.once('SIGINT', () => handleShutdown('SIGINT'));
  process.once('SIGTERM', () => handleShutdown('SIGTERM'));

  // Production Webhook Mode vs Development Long Polling Mode
  if (isProd(config)) {
    logger.info('Operating in PRODUCTION mode: configuring Telegram Webhook...');

    const fullWebhookUrl = `${config.WEBHOOK_DOMAIN.replace(/\/$/, '')}${config.WEBHOOK_PATH}`;

    webhookServer = createWebhookServer(bot);
    await webhookServer.start();

    try {
      await bot.api.setWebhook(fullWebhookUrl, {
        secret_token: config.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: [
          'message',
          'edited_message',
          'callback_query',
          'inline_query',
          'chosen_inline_result',
        ],
        drop_pending_updates: false,
      });

      logger.info(
        { url: fullWebhookUrl },
        `Telegram Webhook set successfully for @${config.TELEGRAM_BOT_USERNAME}`,
      );
    } catch (err) {
      logger.error({ err, url: fullWebhookUrl }, 'Failed to set Telegram Webhook');
      throw err;
    }
  } else {
    logger.info('Operating in DEVELOPMENT mode: starting long polling...');

    // Delete webhook if set previously before starting polling
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: false });
      logger.debug('Previous webhook cleared');
    } catch (err) {
      logger.debug({ err }, 'Error clearing previous webhook (can be ignored)');
    }

    bot.start({
      allowed_updates: [
        'message',
        'edited_message',
        'callback_query',
        'inline_query',
        'chosen_inline_result',
      ],
      onStart: (botInfo) => {
        logger.info(
          { username: botInfo.username, id: botInfo.id },
          `🤖 Telegram Bot @${botInfo.username} started successfully with long polling`,
        );
      },
    });
  }
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during bot bootstrap');
  process.exit(1);
});
