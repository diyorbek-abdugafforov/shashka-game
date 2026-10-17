import type { BotContext } from '../types.js';
import { NotificationService } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

export async function handleBroadcastCommand(ctx: BotContext): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.reply(ctx.t('admin_only'));
    return;
  }

  const rawText = ctx.message?.text || '';
  const broadcastText = rawText.replace(/^\/broadcast(@\w+)?\s*/i, '').trim();

  if (!broadcastText) {
    await ctx.reply(ctx.t('broadcast_usage'), { parse_mode: 'Markdown' });
    return;
  }

  await ctx.reply(ctx.t('broadcast_started'));

  try {
    const formattedMessage = `${ctx.t('admin_broadcast_start')}\n\n${broadcastText}`;
    const result = await NotificationService.broadcastMessage(ctx.api, formattedMessage);

    await ctx.reply(
      ctx.t('broadcast_complete', {
        total: result.total,
        sent: result.sent,
        failed: result.failed,
      }),
    );
  } catch (error) {
    logger.error({ err: error }, 'Error executing admin broadcast');
    await ctx.reply(ctx.t('general_error'));
  }
}
