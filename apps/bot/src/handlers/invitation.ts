import { prisma, GameMode, InvitationStatus, GameStatus, PlayerColor } from '@shashka/database';
import type { BotContext } from '../types.js';
import { getBotConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { getOpenGameKeyboard } from '../utils/keyboard.js';
import { NotificationService } from '../services/notification.service.js';

export function getInitialBoardMatrix() {
  const matrix: Array<Array<{ color: 'WHITE' | 'BLACK'; type: 'MAN' } | null>> = Array.from(
    { length: 8 },
    () => Array(8).fill(null),
  );

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          matrix[row]![col] = { color: 'BLACK', type: 'MAN' };
        } else if (row > 4) {
          matrix[row]![col] = { color: 'WHITE', type: 'MAN' };
        }
      }
    }
  }

  return { matrix };
}

export class InvitationHandler {
  /**
   * Create an invitation and return the deep-link URL
   */
  static async createInvitationLink(
    fromUserId: string,
    targetUserId?: string,
    mode: GameMode = GameMode.CLASSIC,
  ): Promise<string> {
    const config = getBotConfig();
    const expiresAt = new Date(Date.now() + config.INVITATION_EXPIRY_MINUTES * 60 * 1000);

    const invitation = await prisma.gameInvitation.create({
      data: {
        fromUserId,
        toUserId: targetUserId || fromUserId, // if public link, self placeholder
        gameMode: mode,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
    });

    return `https://t.me/${config.TELEGRAM_BOT_USERNAME}?start=invite_${invitation.id}`;
  }

  /**
   * Handle game invitation acceptance
   */
  static async handleAccept(ctx: BotContext, inviteId: string): Promise<void> {
    const guestUser = ctx.dbUser;
    if (!guestUser) {
      await ctx.answerCallbackQuery({ text: ctx.t('general_error'), show_alert: true });
      return;
    }

    try {
      const invitation = await prisma.gameInvitation.findUnique({
        where: { id: inviteId },
        include: {
          fromUser: {
            include: { telegramAccount: true },
          },
        },
      });

      if (!invitation) {
        await ctx.answerCallbackQuery({ text: ctx.t('invite_not_found'), show_alert: true });
        return;
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        await ctx.answerCallbackQuery({
          text: ctx.t('invite_already_processed'),
          show_alert: true,
        });
        return;
      }

      if (new Date() > invitation.expiresAt) {
        await ctx.answerCallbackQuery({ text: ctx.t('invite_expired'), show_alert: true });
        return;
      }

      if (invitation.fromUserId === guestUser.id) {
        await ctx.answerCallbackQuery({ text: ctx.t('invite_self_error'), show_alert: true });
        return;
      }

      const config = getBotConfig();

      // Create game in database and mark invitation as accepted
      const game = await prisma.$transaction(async (tx) => {
        await tx.gameInvitation.update({
          where: { id: inviteId },
          data: {
            toUserId: guestUser.id,
            status: InvitationStatus.ACCEPTED,
          },
        });

        return tx.game.create({
          data: {
            mode: invitation.gameMode,
            status: GameStatus.IN_PROGRESS,
            whitePlayerId: invitation.fromUserId,
            blackPlayerId: guestUser.id,
            currentTurn: PlayerColor.WHITE,
            boardState: getInitialBoardMatrix(),
            moveCount: 0,
            startedAt: new Date(),
            isRated: true,
            config: {
              timeControl: { initialSeconds: 180, incrementSeconds: 2 },
              isGiveaway: invitation.gameMode === GameMode.GIVEAWAY,
              rated: true,
            },
          },
        });
      });

      await ctx.answerCallbackQuery({ text: ctx.t('invite_accepted_guest') });

      // Update guest message with "Enter Game" button
      const openKeyboard = getOpenGameKeyboard(game.id, config.WEB_URL, ctx.lang);
      await ctx.editMessageText(ctx.t('invite_accepted_guest'), {
        reply_markup: openKeyboard,
      });

      // Notify the host (inviter)
      if (invitation.fromUser.telegramAccount?.telegramId) {
        await NotificationService.sendOpponentFound(
          ctx.api,
          invitation.fromUser.telegramAccount.telegramId,
          {
            gameId: game.id,
            opponentName: guestUser.displayName,
            opponentRating: Math.round(guestUser.rating),
            playerColor: 'WHITE',
            language: invitation.fromUser.language,
          },
        );
      }
    } catch (error) {
      logger.error({ err: error, inviteId }, 'Error accepting game invitation');
      await ctx.answerCallbackQuery({ text: ctx.t('general_error'), show_alert: true });
    }
  }

  /**
   * Handle game invitation decline
   */
  static async handleDecline(ctx: BotContext, inviteId: string): Promise<void> {
    const guestUser = ctx.dbUser;
    if (!guestUser) {
      await ctx.answerCallbackQuery({ text: ctx.t('general_error'), show_alert: true });
      return;
    }

    try {
      const invitation = await prisma.gameInvitation.findUnique({
        where: { id: inviteId },
        include: {
          fromUser: {
            include: { telegramAccount: true },
          },
        },
      });

      if (!invitation || invitation.status !== InvitationStatus.PENDING) {
        await ctx.answerCallbackQuery({
          text: ctx.t('invite_already_processed'),
          show_alert: true,
        });
        return;
      }

      await prisma.gameInvitation.update({
        where: { id: inviteId },
        data: {
          toUserId: guestUser.id,
          status: InvitationStatus.DECLINED,
        },
      });

      await ctx.answerCallbackQuery({ text: ctx.t('invite_declined_guest') });
      await ctx.editMessageText(ctx.t('invite_declined_guest'));

      // Notify host
      if (invitation.fromUser.telegramAccount?.telegramId) {
        const msg = ctx.t('invite_declined_host', { guest: guestUser.displayName });
        await ctx.api
          .sendMessage(invitation.fromUser.telegramAccount.telegramId, msg)
          .catch((err) => {
            logger.warn({ err }, 'Failed to notify host about declined invitation');
          });
      }
    } catch (error) {
      logger.error({ err: error, inviteId }, 'Error declining game invitation');
      await ctx.answerCallbackQuery({ text: ctx.t('general_error'), show_alert: true });
    }
  }
}
