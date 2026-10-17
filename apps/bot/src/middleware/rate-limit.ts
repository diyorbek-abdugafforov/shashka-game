import type { Middleware } from 'grammy';
import type { BotContext } from '../types.js';
import { logger } from '../utils/logger.js';
import { t, DEFAULT_LANGUAGE } from '../i18n/index.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  notified: boolean;
}

const userRateLimits = new Map<number, RateLimitRecord>();

// Clean up stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, record] of userRateLimits.entries()) {
    if (record.resetAt <= now) {
      userRateLimits.delete(userId);
    }
  }
}, 60000);

export interface RateLimitOptions {
  windowMs?: number; // default: 60_000 (1 minute)
  maxRequests?: number; // default: 30 requests per minute
}

export function createRateLimitMiddleware(options?: RateLimitOptions): Middleware<BotContext> {
  const windowMs = options?.windowMs ?? 60_000;
  const maxRequests = options?.maxRequests ?? 30;

  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
      return next();
    }

    const now = Date.now();
    let record = userRateLimits.get(userId);

    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + windowMs,
        notified: false,
      };
      userRateLimits.set(userId, record);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      const remainingSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

      if (!record.notified) {
        record.notified = true;
        const lang = ctx.lang || DEFAULT_LANGUAGE;
        const message = t(lang, 'rate_limit_exceeded', { seconds: remainingSeconds });

        try {
          if (ctx.callbackQuery) {
            await ctx.answerCallbackQuery({ text: message, show_alert: true });
          } else {
            await ctx.reply(message);
          }
        } catch (err) {
          logger.debug({ err, userId }, 'Failed to send rate-limit warning');
        }
      }

      logger.warn({ userId, count: record.count }, 'User rate limit exceeded');
      return;
    }

    return next();
  };
}
