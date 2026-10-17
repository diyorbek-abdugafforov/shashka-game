import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../types.js';
import { getBotConfig } from '../config.js';
import { settingsMenu } from './settings-menu.js';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

export const mainMenu = new Menu<BotContext>('main-menu')
  .webApp(
    (ctx) => ctx.t('btn_play'),
    getBotConfig().WEB_URL,
  )
  .row()
  .webApp(
    (ctx) => ctx.t('btn_mini_games'),
    `${getBotConfig().WEB_URL.replace(/\/$/, '')}/mini-games`,
  )
  .webApp(
    (ctx) => ctx.t('btn_shop'),
    `${getBotConfig().WEB_URL.replace(/\/$/, '')}/shop`,
  )
  .row()
  .text(
    (ctx) => ctx.t('btn_stats'),
    async (ctx) => {
      await ctx.answerCallbackQuery();
      const user = ctx.dbUser;
      if (!user) {
        await ctx.reply(ctx.t('general_error'));
        return;
      }

      try {
        const stats = await UserService.getUserStats(user.id);
        const statsMsg = [
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

        await ctx.reply(statsMsg, { parse_mode: 'Markdown' });
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Error loading user stats from menu');
        await ctx.reply(ctx.t('general_error'));
      }
    },
  )
  .submenu(
    (ctx) => ctx.t('btn_settings'),
    'settings-menu',
  )
  .row()
  .text(
    (ctx) => ctx.t('btn_help'),
    async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(ctx.t('help_text'), { parse_mode: 'Markdown' });
    },
  );

// Register submenus
mainMenu.register(settingsMenu);
