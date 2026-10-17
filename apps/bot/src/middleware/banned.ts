import type { Middleware } from 'grammy';
import type { BotContext } from '../types.js';
import { prisma } from '@shashka/database';
import { logger } from '../utils/logger.js';

export function createBannedMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    const user = ctx.dbUser;
    if (!user) {
      return next();
    }

    if (user.isBanned) {
      const now = new Date();

      // Check if temporary ban has expired
      if (user.bannedUntil && user.bannedUntil <= now) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isBanned: false,
              bannedUntil: null,
              banReason: null,
            },
          });
          user.isBanned = false;
          user.bannedUntil = null;
          user.banReason = null;
          logger.info({ userId: user.id }, 'User temporary ban expired, unbanned');
          return next();
        } catch (err) {
          logger.error({ err, userId: user.id }, 'Failed to automatically lift expired ban');
        }
      }

      // User remains banned
      const reason = user.banReason || 'Qoidabuzarlik / Rules violation';
      const untilText = user.bannedUntil
        ? user.bannedUntil.toLocaleDateString('ru-RU')
        : ctx.t('banned_permanent');

      const message = ctx.t('banned_message', {
        reason,
        until: untilText,
      });

      try {
        if (ctx.callbackQuery) {
          await ctx.answerCallbackQuery({ text: message, show_alert: true });
        } else {
          await ctx.reply(message, { parse_mode: 'Markdown' });
        }
      } catch (err) {
        logger.debug({ err, userId: user.id }, 'Failed to deliver ban notice to banned user');
      }

      return; // Stop processing further handlers
    }

    return next();
  };
}
