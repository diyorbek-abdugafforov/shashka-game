import type { BotContext } from '../types.js';
import { InvitationHandler } from './invitation.js';
import { handleStatsCommand } from '../commands/stats.js';
import { handleSettingsCommand } from '../commands/settings.js';
import { handleHelpCommand } from '../commands/help.js';
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

    // Mini Games "Coming Soon" Callback
    if (data === 'action:mini_games') {
      await ctx.answerCallbackQuery({
        text: ctx.t('mini_games_coming_soon'),
        show_alert: true,
      });
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
