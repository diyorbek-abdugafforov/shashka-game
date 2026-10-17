import type { BotContext } from '../types.js';
import { getBotConfig } from '../config.js';
import { getStartKeyboard, getGameInvitationKeyboard } from '../utils/keyboard.js';
import { prisma } from '@shashka/database';
import { logger } from '../utils/logger.js';

export async function handleStartCommand(ctx: BotContext): Promise<void> {
  const config = getBotConfig();
  const payload = ctx.match?.toString().trim();

  // 1. Direct Game Room Deep-Link: /start game_GAME_ID
  if (payload && payload.startsWith('game_')) {
    const gameId = payload.replace(/^game_/, '');
    const webGameUrl = `${config.WEB_URL}/#/game/online/${gameId}`;
    await ctx.reply(
      `⚔️ *Shashka o'yiniga taklif qilindingiz!*\n\nDo'stingiz sizni onlayn bahsga chorladi. Pastdagi tugmani bosing va darhol o'yinga qo'shiling:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⚔️ O'yinga qo'shilish",
                web_app: { url: webGameUrl },
              },
            ],
          ],
        },
      },
    );
    return;
  }

  // 2. Handle Game Invitation Deep-Link: /start invite_INVITE_ID
  if (payload && (payload.startsWith('invite_') || payload.startsWith('inv_'))) {
    const inviteId = payload.replace(/^(invite_|inv_)/, '');

    try {
      const invitation = await prisma.gameInvitation.findUnique({
        where: { id: inviteId },
        include: { fromUser: true },
      });

      if (!invitation) {
        await ctx.reply(ctx.t('invite_not_found'));
      } else if (invitation.status !== 'PENDING') {
        await ctx.reply(ctx.t('invite_already_processed'));
      } else if (new Date() > invitation.expiresAt) {
        await ctx.reply(ctx.t('invite_expired'));
      } else if (ctx.dbUser && invitation.fromUserId === ctx.dbUser.id) {
        await ctx.reply(ctx.t('invite_self_error'));
      } else {
        const inviteMsg = ctx.t('invite_received', {
          inviter: invitation.fromUser.displayName,
          mode: invitation.gameMode,
          timeControl: '3 min + 2s',
        });

        const keyboard = getGameInvitationKeyboard(invitation.id, ctx.lang);
        await ctx.reply(inviteMsg, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        return;
      }
    } catch (err) {
      logger.error({ err, inviteId }, 'Error loading game invitation in start command');
    }
  }

  // 2. Standard Welcome with 3-button Inline Keyboard
  // Buttons:
  // 1. 🎮 Shashka o'ynash (web_app)
  // 2. 🕹 Mini o'yinlar (callback)
  // 3. 🛒 Do'kon (web_app to /shop)
  let welcomeText = ctx.t('welcome');

  if (payload && /^ref/i.test(payload)) {
    const cleanRef = payload.replace(/^(ref_|ref=|ref)/i, '').trim();
    if (cleanRef) {
      try {
        const referrer = await prisma.user.findFirst({
          where: {
            OR: [{ id: cleanRef }, { telegramAccount: { telegramId: cleanRef } }],
          },
        });
        if (referrer) {
          welcomeText = `${ctx.t('welcome_referred', { name: referrer.displayName })}\n\n${welcomeText}`;
        }
      } catch (err) {
        logger.debug({ err }, 'Error looking up referrer for start message');
      }
    }
  }

  const keyboard = getStartKeyboard(ctx.lang, config.WEB_URL);

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}
