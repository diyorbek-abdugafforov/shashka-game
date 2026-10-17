import type { TranslationKey } from './uz.js';

export const en: Record<TranslationKey, string> = {
  // Start & Welcome
  welcome: `🎮 Russian Checkers — Online Game\n\nWelcome! Play checkers with bots and your friends.`,
  welcome_referred: `🎁 You joined via invitation from **{name}**! Welcome aboard!`,

  // Buttons
  btn_play: `🎮 Play Checkers`,
  btn_mini_games: `🕹 Mini Games`,
  btn_shop: `🛒 Shop`,
  btn_stats: `📊 Statistics`,
  btn_settings: `⚙️ Settings`,
  btn_help: `ℹ️ Rules & Help`,
  btn_invite_friend: `👥 Invite Friend`,
  btn_accept: `✅ Accept`,
  btn_decline: `❌ Decline`,
  btn_back: `⬅️ Back`,
  btn_lang_uz: `🇺🇿 O'zbekcha`,
  btn_lang_ru: `🇷🇺 Русский`,
  btn_lang_en: `🇬🇧 English`,
  btn_notifications_on: `🔔 Notifications: Enabled`,
  btn_notifications_off: `🔕 Notifications: Disabled`,

  // Mini games callback
  mini_games_coming_soon: `🕹 Mini games are coming soon! Stay tuned.`,

  // Help & Rules
  help_text: `📖 **Russian Checkers Rules & Bot Guide**

♟ **Basic Rules:**
• The game is played on the dark squares of an 8x8 board.
• Ordinary checkers move forward diagonally by one square.
• **Capturing is mandatory!** A checker captures both forward and backward.
• When multi-capturing is possible, continuing the jump sequence is required.
• When a checker reaches the back rank, it is promoted to a **King (Damka)**.
• Kings can move any number of squares diagonally in any direction.

🤖 **Bot Commands:**
• /start — Open main menu and launch game
• /stats — View your statistics and rating
• /settings — Change language and preferences
• /help — Game rules and commands

Enjoy your games and have fun! 🏆`,

  // Settings
  settings_title: `⚙️ **Settings**\n\nConfigure your interface language and notification preferences:`,
  lang_changed: `✅ Language successfully changed: **English**`,
  notifications_toggled: `Notification status updated: {status}`,

  // Stats
  stats_title: `📊 **Your Statistics**`,
  stats_player: `👤 Player: **{name}**`,
  stats_rating: `⭐ Rating: **{rating}**`,
  stats_games: `🎮 Total Games: **{total}**`,
  stats_wins: `🏆 Wins: **{wins}**`,
  stats_draws: `🤝 Draws: **{draws}**`,
  stats_losses: `💔 Losses: **{losses}**`,
  stats_winrate: `📈 Win Rate: **{winrate}%**`,
  stats_balance: `🪙 Balance: **{balance} coins**`,
  stats_referrals: `👥 Friends Invited: **{referrals}**`,
  stats_ref_link: `🔗 Your Referral Link:\n\`{link}\``,

  // Invitations
  invite_share_text: `🎮 Let's play Russian Checkers! Click the link below to join my match:`,
  invite_link_generated: `🔗 Your match invitation link:\n\`{link}\`\n\nShare it with a friend! Valid for 15 minutes.`,
  invite_received: `⚔️ **{inviter}** invited you to play Russian Checkers!\n\nMode: **{mode}**\nTime control: **{timeControl}**\n\nThis invite is valid for 15 minutes.`,
  invite_accepted_host: `✅ **{guest}** accepted your game invitation! The game has started.`,
  invite_accepted_guest: `✅ Invitation accepted! Click below to enter the game:`,
  invite_declined_host: `❌ **{guest}** declined your invitation.`,
  invite_declined_guest: `You declined the invitation.`,
  invite_expired: `⏳ This game invitation has expired.`,
  invite_not_found: `⚠️ Invitation not found or cancelled.`,
  invite_already_processed: `⚠️ This invitation has already been processed.`,
  invite_self_error: `⚠️ You cannot accept your own invitation!`,

  // Matchmaking & Game Notifications
  opponent_found: `🎯 **Opponent found!**\n\nOpponent: **{opponent}**\nRating: **{rating}**\nYour color: **{color}**\n\nClick below to enter the match:`,
  btn_open_game: `🎮 Enter Game`,
  color_white: `White (moves first)`,
  color_black: `Black`,

  // Game Result
  game_result_win: `🎉 **Victory!**\nYou won the match!\nRating change: **+{change}**\nNew rating: **{rating}**`,
  game_result_loss: `💔 **Defeat**\nBetter luck next time.\nRating change: **{change}**\nNew rating: **{rating}**`,
  game_result_draw: `🤝 **Draw!**\nThe match ended in a draw.\nRating change: **{change}**\nNew rating: **{rating}**`,

  // Referrals
  referral_reward_notification: `🎉 **Congratulations!**\nYour friend **{name}** joined via your link!\nYou earned **+{amount} coins** 🪙`,

  // Moderation & Banned
  banned_message: `⛔️ **Your account is suspended.**\n\nReason: {reason}\nSuspended until: {until}\n\nContact support if you think this is a mistake.`,
  banned_permanent: `Permanent`,

  // Errors & Rate limit
  rate_limit_exceeded: `⚠️ Too many requests. Please wait {seconds} seconds.`,
  general_error: `❌ An unexpected error occurred. Please try again later.`,

  // Admin Broadcast
  admin_broadcast_start: `📢 Administrator Announcement:`,
  admin_only: `⚠️ This command is only available to bot administrators.`,
  broadcast_usage: `Usage: \`/broadcast Your message here\``,
  broadcast_started: `🚀 Broadcast started...`,
  broadcast_complete: `✅ Broadcast finished!\n\nTotal: {total}\nSent: {sent}\nFailed: {failed}`,
};
