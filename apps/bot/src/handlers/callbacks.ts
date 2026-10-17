import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../types.js';
import { InvitationHandler } from './invitation.js';
import { handleStatsCommand } from '../commands/stats.js';
import { handleSettingsCommand } from '../commands/settings.js';
import { handleHelpCommand } from '../commands/help.js';
import { handleAdminCommand } from '../commands/admin.js';
import { UserService } from '../services/user.service.js';
import { getStartKeyboard } from '../utils/keyboard.js';
import { getBotConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { isSupportedLanguage, type SupportedLanguage } from '../i18n/index.js';

export async function handleCallbackQueries(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  try {
    // 1. Play & Shop Callbacks for localhost / development
    if (data === 'action:open_play_info') {
      await ctx.answerCallbackQuery({
        text: '🎮 Shashka o‘yini kompyuteringizda http://localhost:3000 manzilida ishlamoqda. Brauzeringiz orqali kirib o‘ynashingiz mumkin!',
        show_alert: true,
      });
      return;
    }

    if (data === 'action:open_shop_info') {
      await ctx.answerCallbackQuery({
        text: '🛒 Do‘kon kompyuteringizda http://localhost:3000/shop manzilida ishlamoqda.',
        show_alert: true,
      });
      return;
    }

    // Mini Games Interactive Callback
    if (data === 'action:mini_games') {
      await ctx.answerCallbackQuery();
      const config = getBotConfig();
      const kb = new InlineKeyboard()
        .text('🎲 Omad zarini tashlash', 'mini:roll_dice')
        .row();
      const miniGamesUrl = `${config.WEB_URL.replace(/\/$/, '')}/mini-games`;
      if (config.WEB_URL.startsWith('https://')) {
        kb.webApp('🧩 Web Taktik Jumboqlar', miniGamesUrl);
      } else {
        kb.url('🧩 Web Taktik Jumboqlar', miniGamesUrl);
      }
      kb.row().text('🔙 Asosiy menyu', 'menu:main');

      await ctx.reply(
        '🎲 *Shashka Mini-O‘yinlar Bo‘limi*\n\n' +
        'Bu yerda siz qo‘shimcha tangalar ishlab olishingiz va mahoratingizni oshirishingiz mumkin:\n\n' +
        '1️⃣ *Omad Zari* — Telegram ichida zarni tashlab 100 dan 600 gacha tanga yuting!\n' +
        '2️⃣ *Taktik Jumboqlar* — Web ilovada shashka kombinatsiyalarini yechib 300-500 tanga ishlang!',
        {
          parse_mode: 'Markdown',
          reply_markup: kb,
        },
      );
      return;
    }

    if (data === 'mini:roll_dice') {
      await ctx.answerCallbackQuery({ text: 'Zar tashlanmoqda...' });
      const diceMsg = await ctx.replyWithDice('🎲');
      const diceVal = diceMsg.dice?.value || Math.floor(Math.random() * 6) + 1;
      const coinReward = diceVal * 100;

      let newBalance = 0;
      if (ctx.dbUser) {
        newBalance = await UserService.addCoins(
          ctx.dbUser.id,
          coinReward,
          `Telegram Omad zari: ${diceVal}`,
        );
      }

      const config = getBotConfig();
      const kb = new InlineKeyboard()
        .text('🎲 Yana tashlash', 'mini:roll_dice')
        .row();

      const shopUrl = `${config.WEB_URL.replace(/\/$/, '')}/shop`;
      if (config.WEB_URL.startsWith('https://')) {
        kb.webApp('🛒 Do‘konga o‘tish', shopUrl);
      } else {
        kb.url('🛒 Do‘konga o‘tish', shopUrl);
      }
      kb.row().text('🔙 Asosiy menyu', 'menu:main');

      setTimeout(async () => {
        try {
          await ctx.reply(
            `🎉 *Tabriklaymiz!*\n\n` +
            `Sizga zarda *${diceVal}* tushdi!\n` +
            `💰 Hamyoningizga *+${coinReward} tanga* qo‘shildi!\n` +
            (newBalance > 0 ? `💵 Yangi balansingiz: *${newBalance} tanga*` : ''),
            {
              parse_mode: 'Markdown',
              reply_markup: kb,
            },
          );
        } catch (e) {
          logger.warn({ e }, 'Failed to send dice reward message');
        }
      }, 1500);
      return;
    }

    // 2. Navigation Commands via Callbacks
    if (data === 'cmd:stats') {
      await ctx.answerCallbackQuery();
      await handleStatsCommand(ctx);
      return;
    }

    if (data === 'cmd:settings') {
      await ctx.answerCallbackQuery();
      await handleSettingsCommand(ctx);
      return;
    }

    if (data === 'cmd:help') {
      await ctx.answerCallbackQuery();
      await handleHelpCommand(ctx);
      return;
    }

    if (data === 'admin:refresh_stats') {
      await ctx.answerCallbackQuery({ text: 'Yangilanmoqda...' });
      await handleAdminCommand(ctx);
      return;
    }

    if (data === 'admin:help_broadcast') {
      await ctx.answerCallbackQuery();
      await ctx.reply(
        "📢 *Ommaviy xabar yuborish (Broadcast):*\n\n" +
        "Barcha o‘yinchilarga e'lon yoki yangilik yuborish uchun quyidagicha yozing:\n\n" +
        "`/broadcast Assalomu alaykum! Yangi shashka turniri boshlandi!`\n\n" +
        "_Xabar barcha bot a'zolariga avtomatik yetkaziladi._",
        { parse_mode: 'Markdown' },
      );
      return;
    }

    if (data === 'menu:main') {
      await ctx.answerCallbackQuery();
      const config = getBotConfig();
      const keyboard = getStartKeyboard(ctx.lang, config.WEB_URL);
      await ctx.reply(ctx.t('welcome'), {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      return;
    }

    // 3. Language Selector Callbacks: set_lang:uz / set_lang:ru / set_lang:en
    if (data.startsWith('set_lang:')) {
      const candidateLang = data.split(':')[1];
      if (isSupportedLanguage(candidateLang)) {
        const selectedLang: SupportedLanguage = candidateLang;
        if (ctx.session) {
          ctx.session.language = selectedLang;
        }
        ctx.lang = selectedLang;

        if (ctx.dbUser) {
          await UserService.updateLanguage(ctx.dbUser.id, selectedLang);
          ctx.dbUser.language = selectedLang;
        }

        await ctx.answerCallbackQuery({ text: ctx.t('lang_changed') });

        const config = getBotConfig();
        const keyboard = getStartKeyboard(selectedLang, config.WEB_URL);
        await ctx.reply(ctx.t('welcome'), {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        return;
      }
    }

    // 4. Invitation Callbacks: inv_acc:ID / inv_dec:ID
    if (data.startsWith('inv_acc:')) {
      const inviteId = data.replace('inv_acc:', '');
      await InvitationHandler.handleAccept(ctx, inviteId);
      return;
    }

    if (data.startsWith('inv_dec:')) {
      const inviteId = data.replace('inv_dec:', '');
      await InvitationHandler.handleDecline(ctx, inviteId);
      return;
    }

    // Fallback for unhandled callback queries
    await ctx.answerCallbackQuery();
  } catch (error) {
    logger.error({ err: error, data }, 'Error in callback query handler');
    try {
      await ctx.answerCallbackQuery({ text: ctx.t('general_error'), show_alert: true });
    } catch {
      // Ignored if expired
    }
  }
}
