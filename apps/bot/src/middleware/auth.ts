import type { Middleware } from 'grammy';
import type { BotContext } from '../types.js';
import { UserService } from '../services/user.service.js';
import { NotificationService } from '../services/notification.service.js';
import { getBotConfig } from '../config.js';
import { logger } from '../utils/logger.js';

export function createAuthMiddleware(): Middleware<BotContext> {
  const config = getBotConfig();

  return async (ctx, next) => {
    ctx.dbUser = null;
    ctx.isAdmin = false;

    const tgUser = ctx.from;
    if (!tgUser) {
      return next();
    }

    const strTelegramId = String(tgUser.id);
    ctx.isAdmin = config.ADMIN_TELEGRAM_IDS.includes(strTelegramId);

    try {
      // Extract referral parameter from /start command if this is the start message
      let referralParam: string | undefined;
      const messageText = ctx.message?.text?.trim();
      if (messageText && messageText.startsWith('/start')) {
        const parts = messageText.split(/\s+/);
        if (parts.length > 1 && parts[1] && /^ref/i.test(parts[1])) {
          referralParam = parts[1];
        }
      }

      const regResult = await UserService.findOrCreateTelegramUser(
        {
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          language_code: tgUser.language_code,
        },
        referralParam,
      );

      ctx.dbUser = regResult.user;

      if (
        regResult.user.role === 'ADMIN' ||
        regResult.user.role === 'SUPER_ADMIN'
      ) {
        ctx.isAdmin = true;
      }

      // If user was newly registered via referral, notify the referrer
      if (regResult.isNewUser && regResult.referrer?.telegramAccount?.telegramId) {
        NotificationService.sendReferralReward(
          ctx.api,
          regResult.referrer.telegramAccount.telegramId,
          {
            referredName: regResult.user.displayName,
            rewardAmount: regResult.referralRewardAmount,
            language: regResult.referrer.language,
          },
        ).catch((err) => {
          logger.warn({ err }, 'Failed to send referral reward notification');
        });
      }
    } catch (error) {
      logger.error({ err: error, tgUser: ctx.from }, 'Failed to authenticate user in middleware');
    }

    return next();
  };
}
