import type { BotContext } from '../types.js';
import { settingsMenu } from '../menus/settings-menu.js';

export async function handleSettingsCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(ctx.t('settings_title'), {
    parse_mode: 'Markdown',
    reply_markup: settingsMenu,
  });
}
