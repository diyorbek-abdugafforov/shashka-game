import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../types.js';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';
import type { SupportedLanguage } from '../i18n/index.js';

export const settingsMenu = new Menu<BotContext>('settings-menu')
  .text(
    (ctx) => `${ctx.lang === 'uz' ? '🔘 ' : ''}${ctx.t('btn_lang_uz')}`,
    async (ctx) => {
      await updateLanguage(ctx, 'uz');
    },
  )
  .row()
  .text(
    (ctx) => `${ctx.lang === 'ru' ? '🔘 ' : ''}${ctx.t('btn_lang_ru')}`,
    async (ctx) => {
      await updateLanguage(ctx, 'ru');
    },
  )
  .row()
  .text(
    (ctx) => `${ctx.lang === 'en' ? '🔘 ' : ''}${ctx.t('btn_lang_en')}`,
    async (ctx) => {
      await updateLanguage(ctx, 'en');
    },
  )
  .row()
  .text(
    (ctx) =>
      ctx.session.notificationsEnabled !== false
        ? ctx.t('btn_notifications_on')
        : ctx.t('btn_notifications_off'),
    async (ctx) => {
      ctx.session.notificationsEnabled = ctx.session.notificationsEnabled === false;
      const statusText = ctx.session.notificationsEnabled ? 'ON' : 'OFF';
      await ctx.answerCallbackQuery({
        text: ctx.t('notifications_toggled', { status: statusText }),
      });
      ctx.menu.update();
    },
  )
  .row()
  .back((ctx) => ctx.t('btn_back'));

async function updateLanguage(ctx: BotContext, newLang: SupportedLanguage) {
  if (ctx.session) {
    ctx.session.language = newLang;
  }
  ctx.lang = newLang;

  if (ctx.dbUser) {
    try {
      await UserService.updateLanguage(ctx.dbUser.id, newLang);
      ctx.dbUser.language = newLang;
    } catch (err) {
      logger.error({ err, userId: ctx.dbUser.id }, 'Failed to save updated language to DB');
    }
  }

  await ctx.answerCallbackQuery({
    text: ctx.t('lang_changed'),
  });

  ctx.menu.update();
}
