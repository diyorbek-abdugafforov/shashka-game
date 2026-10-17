import { InlineKeyboard } from 'grammy';
import { t, type SupportedLanguage } from '../i18n/index.js';

export function getStartKeyboard(lang: SupportedLanguage, webAppUrl: string): InlineKeyboard {
  const isHttps = webAppUrl.startsWith('https://');
  const isPublicUrl = !webAppUrl.includes('localhost') && !webAppUrl.includes('127.0.0.1');
  const shopUrl = `${webAppUrl.replace(/\/$/, '')}/shop`;
  const miniGamesUrl = `${webAppUrl.replace(/\/$/, '')}/mini-games`;

  const kb = new InlineKeyboard();

  if (isHttps) {
    kb.webApp(t(lang, 'btn_play'), webAppUrl);
  } else if (isPublicUrl) {
    kb.url(t(lang, 'btn_play'), webAppUrl);
  } else {
    kb.text(t(lang, 'btn_play'), 'action:open_play_info');
  }

  if (isHttps) {
    kb.row().webApp(t(lang, 'btn_mini_games'), miniGamesUrl);
  } else if (isPublicUrl) {
    kb.row().url(t(lang, 'btn_mini_games'), miniGamesUrl);
  } else {
    kb.row().text(t(lang, 'btn_mini_games'), 'action:mini_games');
  }

  if (isHttps) {
    kb.webApp(t(lang, 'btn_shop'), shopUrl);
  } else if (isPublicUrl) {
    kb.url(t(lang, 'btn_shop'), shopUrl);
  } else {
    kb.text(t(lang, 'btn_shop'), 'action:open_shop_info');
  }

  return kb
    .row()
    .text(t(lang, 'btn_stats'), 'cmd:stats')
    .text(t(lang, 'btn_settings'), 'cmd:settings')
    .row()
    .text(t(lang, 'btn_help'), 'cmd:help');
}

export function getLanguageKeyboard(currentLang: SupportedLanguage): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      `${currentLang === 'uz' ? '🔘 ' : ''}${t('uz', 'btn_lang_uz')}`,
      'set_lang:uz',
    )
    .row()
    .text(
      `${currentLang === 'ru' ? '🔘 ' : ''}${t('ru', 'btn_lang_ru')}`,
      'set_lang:ru',
    )
    .row()
    .text(
      `${currentLang === 'en' ? '🔘 ' : ''}${t('en', 'btn_lang_en')}`,
      'set_lang:en',
    )
    .row()
    .text(t(currentLang, 'btn_back'), 'menu:main');
}

export function getGameInvitationKeyboard(
  inviteId: string,
  lang: SupportedLanguage,
): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(lang, 'btn_accept'), `inv_acc:${inviteId}`)
    .text(t(lang, 'btn_decline'), `inv_dec:${inviteId}`);
}

export function getOpenGameKeyboard(
  gameId: string,
  webAppUrl: string,
  lang: SupportedLanguage,
): InlineKeyboard {
  const gameUrl = `${webAppUrl.replace(/\/$/, '')}/game/${gameId}`;
  if (webAppUrl.startsWith('https://')) {
    return new InlineKeyboard().webApp(t(lang, 'btn_open_game'), gameUrl);
  }
  return new InlineKeyboard().url(t(lang, 'btn_open_game'), gameUrl);
}

export function getInviteShareKeyboard(
  inviteLink: string,
  lang: SupportedLanguage,
): InlineKeyboard {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
    t(lang, 'invite_share_text'),
  )}`;
  return new InlineKeyboard().url(t(lang, 'btn_invite_friend'), shareUrl);
}
