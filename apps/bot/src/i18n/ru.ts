import type { TranslationKey } from './uz.js';

export const ru: Record<TranslationKey, string> = {
  // Start & Welcome
  welcome: `🎮 Русские Шашки — Онлайн Игра\n\nДобро пожаловать! Играйте в шашки с ботом и друзьями.`,
  welcome_referred: `🎁 Вы присоединились по приглашению игрока **{name}**! Добро пожаловать!`,

  // Buttons
  btn_play: `🎮 Играть в шашки`,
  btn_mini_games: `🕹 Мини-игры`,
  btn_shop: `🛒 Магазин`,
  btn_stats: `📊 Статистика`,
  btn_settings: `⚙️ Настройки`,
  btn_help: `ℹ️ Правила и помощь`,
  btn_invite_friend: `👥 Пригласить друга`,
  btn_accept: `✅ Принять`,
  btn_decline: `❌ Отклонить`,
  btn_back: `⬅️ Назад`,
  btn_lang_uz: `🇺🇿 O'zbekcha`,
  btn_lang_ru: `🇷🇺 Русский`,
  btn_lang_en: `🇬🇧 English`,
  btn_notifications_on: `🔔 Уведомления: Включены`,
  btn_notifications_off: `🔕 Уведомления: Отключены`,

  // Mini games callback
  mini_games_coming_soon: `🕹 Мини-игры скоро появятся! Следите за обновлениями.`,

  // Help & Rules
  help_text: `📖 **Правила русских шашек и справка по боту**

♟ **Основные правила:**
• Игра ведется на черных полях доски 8x8.
• Простые шашки ходят по диагонали вперед на одну клетку.
• **Взятие (бой) обязательно!** Шашка бьет как вперед, так и назад.
• При возможности взятия нескольких шашек бой продолжается дальше.
• Достигнув последней горизонтали, шашка превращается в **Дамку**.
• Дамка может ходить на любое число полей по диагонали.

🤖 **Команды бота:**
• /start — Главное меню и запуск игры
• /stats — Ваша статистика и рейтинг
• /settings — Смена языка и настроек
• /help — Правила и справка

Приятной игры и красивых побед! 🏆`,

  // Settings
  settings_title: `⚙️ **Настройки**\n\nЗдесь вы можете изменить язык интерфейса и параметры уведомлений:`,
  lang_changed: `✅ Язык успешно изменен: **Русский**`,
  notifications_toggled: `Статус уведомлений обновлен: {status}`,

  // Stats
  stats_title: `📊 **Ваша статистика**`,
  stats_player: `👤 Игрок: **{name}**`,
  stats_rating: `⭐ Рейтинг: **{rating}**`,
  stats_games: `🎮 Всего игр: **{total}**`,
  stats_wins: `🏆 Побед: **{wins}**`,
  stats_draws: `🤝 Ничьих: **{draws}**`,
  stats_losses: `💔 Поражений: **{losses}**`,
  stats_winrate: `📈 Процент побед: **{winrate}%**`,
  stats_balance: `🪙 Баланс: **{balance} монет**`,
  stats_referrals: `👥 Приглашено друзей: **{referrals}**`,
  stats_ref_link: `🔗 Ваша реферальная ссылка:\n\`{link}\``,

  // Invitations
  invite_share_text: `🎮 Сыграем в русские шашки? Переходи по ссылке и начнем партию:`,
  invite_link_generated: `🔗 Ваша ссылка-приглашение на игру:\n\`{link}\`\n\nОтправьте её другу! Ссылка действует 15 минут.`,
  invite_received: `⚔️ **{inviter}** приглашает вас на партию в шашки!\n\nРежим: **{mode}**\nКонтроль времени: **{timeControl}**\n\nПриглашение действует 15 минут.`,
  invite_accepted_host: `✅ **{guest}** принял ваше приглашение! Игра началась.`,
  invite_accepted_guest: `✅ Приглашение принято! Нажмите кнопку ниже для перехода в игру:`,
  invite_declined_host: `❌ **{guest}** отклонил ваше приглашение.`,
  invite_declined_guest: `Вы отклонили приглашение.`,
  invite_expired: `⏳ Срок действия этого приглашения истек.`,
  invite_not_found: `⚠️ Приглашение не найдено или было отменено.`,
  invite_already_processed: `⚠️ Это приглашение уже было обработано.`,
  invite_self_error: `⚠️ Вы не можете принять собственное приглашение!`,

  // Matchmaking & Game Notifications
  opponent_found: `🎯 **Соперник найден!**\n\nСоперник: **{opponent}**\nРейтинг: **{rating}**\nВаш цвет: **{color}**\n\nНажмите кнопку, чтобы зайти в игру:`,
  btn_open_game: `🎮 Войти в игру`,
  color_white: `Белые (первый ход)`,
  color_black: `Черные`,

  // Game Result
  game_result_win: `🎉 **Победа!**\nВы победили в партии!\nИзменение рейтинга: **+{change}**\nНовый рейтинг: **{rating}**`,
  game_result_loss: `💔 **Поражение**\nВ этот раз не повезло.\nИзменение рейтинга: **{change}**\nНовый рейтинг: **{rating}**`,
  game_result_draw: `🤝 **Ничья!**\nПартия завершилась ничьей.\nИзменение рейтинга: **{change}**\nНовый рейтинг: **{rating}**`,

  // Referrals
  referral_reward_notification: `🎉 **Поздравляем!**\nДруг **{name}** присоединился по вашей ссылке!\nВам начислено **+{amount} монет** 🪙`,

  // Moderation & Banned
  banned_message: `⛔️ **Ваш аккаунт заблокирован.**\n\nПричина: {reason}\nСрок блокировки: {until}\n\nПо вопросам обращайтесь в поддержку.`,
  banned_permanent: `Бессрочно`,

  // Errors & Rate limit
  rate_limit_exceeded: `⚠️ Слишком много запросов. Пожалуйста, подождите {seconds} сек.`,
  general_error: `❌ Произошла ошибка. Пожалуйста, попробуйте позже.`,

  // Admin Broadcast
  admin_broadcast_start: `📢 Сообщение от администрации:`,
  admin_only: `⚠️ Эта команда доступна только администраторам бота.`,
  broadcast_usage: `Для рассылки отправьте команду в формате:\n\`/broadcast Текст сообщения\``,
  broadcast_started: `🚀 Рассылка запущена...`,
  broadcast_complete: `✅ Рассылка завершена!\n\nВсего: {total}\nУспешно: {sent}\nОшибок: {failed}`,
};
