import Fastify, { type FastifyInstance } from 'fastify';
import { webhookCallback, type Bot } from 'grammy';
import type { BotContext } from './types.js';
import { getBotConfig } from './config.js';
import { logger } from './utils/logger.js';

export interface WebhookServerInstance {
  server: FastifyInstance;
  start: () => Promise<string>;
  stop: () => Promise<void>;
}

export function createWebhookServer(bot: Bot<BotContext>): WebhookServerInstance {
  const config = getBotConfig();

  const server = Fastify({
    logger: false, // Use our centralized pino logger
    disableRequestLogging: true,
  });

  // Health check endpoint
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: 'shashka-bot',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Webhook handler
  const grammyCallback = webhookCallback(bot, 'fastify', {
    secretToken: config.TELEGRAM_WEBHOOK_SECRET,
  });

  // Telegram webhook endpoint with secret verification
  server.post(config.WEBHOOK_PATH, async (req, reply) => {
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];

    if (config.TELEGRAM_WEBHOOK_SECRET && receivedSecret !== config.TELEGRAM_WEBHOOK_SECRET) {
      logger.warn(
        { ip: req.ip, headers: req.headers },
        'Rejected unauthorized webhook request: invalid secret token',
      );
      reply.status(401).send({ error: 'Unauthorized: Invalid webhook secret token' });
      return;
    }

    return grammyCallback(req, reply);
  });

  return {
    server,
    start: async () => {
      const address = await server.listen({
        port: config.BOT_PORT,
        host: '0.0.0.0',
      });
      logger.info(
        { port: config.BOT_PORT, path: config.WEBHOOK_PATH },
        `Webhook Fastify server listening on ${address}`,
      );
      return address;
    },
    stop: async () => {
      logger.info('Stopping webhook Fastify server...');
      await server.close();
      logger.info('Webhook Fastify server closed');
    },
  };
}
