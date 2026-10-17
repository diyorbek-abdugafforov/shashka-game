import type { BotContext } from '../types.js';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';
import { getInviteShareKeyboard } from '../utils/keyboard.js';

export async function handleStatsCommand(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply(ctx.t('general_error'));
    return;
  }

  try {
    const stats = await UserService.getUserStats(user.id);

    const message = [
      ctx.t('stats_title'),
      '',
      ctx.t('stats_player', { name: stats.displayName }),
      ctx.t('stats_rating', { rating: stats.rating }),
      ctx.t('stats_games', { total: stats.totalGames }),
      ctx.t('stats_wins', { wins: stats.wins }),
      ctx.t('stats_draws', { draws: stats.draws }),
      ctx.t('stats_losses', { losses: stats.losses }),
      ctx.t('stats_winrate', { winrate: stats.winrate }),
      ctx.t('stats_balance', { balance: stats.balance }),
      ctx.t('stats_referrals', { referrals: stats.referralsCount }),
      '',
      ctx.t('stats_ref_link', { link: stats.referralLink }),
    ].join('\n');

    const keyboard = getInviteShareKeyboard(stats.referralLink, ctx.lang);

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (error) {
    logger.error({ err: error, userId: user.id }, 'Error retrieving statistics');
    await ctx.reply(ctx.t('general_error'));
  }
}
