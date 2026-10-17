import type { BotContext } from '../types.js';

export async function handleHelpCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(ctx.t('help_text'), {
    parse_mode: 'Markdown',
  });
}
