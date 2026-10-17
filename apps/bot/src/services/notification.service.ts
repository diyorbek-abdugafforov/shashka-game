import type { Api } from 'grammy';
import { getBotConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { t, normalizeLanguage } from '../i18n/index.js';
import { getGameInvitationKeyboard, getOpenGameKeyboard } from '../utils/keyboard.js';
import { UserService } from './user.service.js';

export class NotificationService {
  /**
   * Send game invitation notification with Accept/Decline action buttons
   */
  static async sendGameInvitation(
    api: Api,
    toTelegramId: string,
    invitation: {
      id: string;
      inviterName: string;
      gameMode?: string;
      timeControl?: string;
      targetLanguage?: string;
    },
  ): Promise<boolean> {
    const lang = normalizeLanguage(invitation.targetLanguage);

    const message = t(lang, 'invite_received', {
      inviter: invitation.inviterName,
      mode: invitation.gameMode || 'Klassik / Classic',
      timeControl: invitation.timeControl || '3 min + 2s',
    });

    const keyboard = getGameInvitationKeyboard(invitation.id, lang);

    try {
      await api.sendMessage(toTelegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      return true;
    } catch (error) {
      logger.warn({ err: error, toTelegramId }, 'Failed to deliver game invitation notification');
      return false;
    }
  }

  /**
   * Send notification when an opponent is found in matchmaking
   */
  static async sendOpponentFound(
    api: Api,
    telegramId: string,
    data: {
      gameId: string;
      opponentName: string;
      opponentRating: number;
      playerColor: 'WHITE' | 'BLACK';
      language?: string;
    },
  ): Promise<boolean> {
    const config = getBotConfig();
    const lang = normalizeLanguage(data.language);

    const colorText =
      data.playerColor === 'WHITE'
        ? t(lang, 'color_white')
        : t(lang, 'color_black');

    const message = t(lang, 'opponent_found', {
      opponent: data.opponentName,
      rating: data.opponentRating,
      color: colorText,
    });

    const keyboard = getOpenGameKeyboard(data.gameId, config.WEB_URL, lang);

    try {
      await api.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      return true;
    } catch (error) {
      logger.warn({ err: error, telegramId }, 'Failed to deliver opponent found notification');
      return false;
    }
  }

  /**
   * Send game finish result notification
   */
  static async sendGameResult(
    api: Api,
    telegramId: string,
    data: {
      resultType: 'win' | 'loss' | 'draw';
      change: number;
      newRating: number;
      language?: string;
    },
  ): Promise<boolean> {
    const lang = normalizeLanguage(data.language);
    let key: 'game_result_win' | 'game_result_loss' | 'game_result_draw' = 'game_result_draw';

    if (data.resultType === 'win') key = 'game_result_win';
    else if (data.resultType === 'loss') key = 'game_result_loss';

    const message = t(lang, key, {
      change: data.change > 0 ? `+${data.change}` : String(data.change),
      rating: Math.round(data.newRating),
    });

    try {
      await api.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
      });
      return true;
    } catch (error) {
      logger.warn({ err: error, telegramId }, 'Failed to deliver game result notification');
      return false;
    }
  }

  /**
   * Send referral reward notification to the referrer
   */
  static async sendReferralReward(
    api: Api,
    referrerTelegramId: string,
    data: {
      referredName: string;
      rewardAmount: number;
      language?: string;
    },
  ): Promise<boolean> {
    const lang = normalizeLanguage(data.language);

    const message = t(lang, 'referral_reward_notification', {
      name: data.referredName,
      amount: data.rewardAmount,
    });

    try {
      await api.sendMessage(referrerTelegramId, message, {
        parse_mode: 'Markdown',
      });
      return true;
    } catch (error) {
      logger.warn(
        { err: error, referrerTelegramId },
        'Failed to deliver referral reward notification',
      );
      return false;
    }
  }

  /**
   * Admin broadcast to all registered Telegram users
   */
  static async broadcastMessage(
    api: Api,
    text: string,
  ): Promise<{ total: number; sent: number; failed: number }> {
    const users = await UserService.getAllTelegramUsers();
    let sent = 0;
    let failed = 0;

    logger.info({ totalUsers: users.length }, 'Starting admin broadcast');

    for (const user of users) {
      try {
        await api.sendMessage(user.telegramId, text, {
          parse_mode: 'Markdown',
        });
        sent++;
      } catch (err) {
        failed++;
        logger.debug({ err, telegramId: user.telegramId }, 'Broadcast message skipped/failed');
      }

      // Small delay to respect Telegram flood limits (30 messages per second)
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    logger.info({ total: users.length, sent, failed }, 'Admin broadcast completed');
    return { total: users.length, sent, failed };
  }
}
