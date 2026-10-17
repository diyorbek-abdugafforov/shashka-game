import type { Middleware } from 'grammy';
import type { BotContext } from '../types.js';
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  t,
  type SupportedLanguage,
  type TranslationKey,
} from '../i18n/index.js';

export function createLanguageMiddleware(): Middleware<BotContext> {
  return async (ctx, next) => {
    let resolvedLang: SupportedLanguage = DEFAULT_LANGUAGE;

    if (ctx.session?.language) {
      resolvedLang = ctx.session.language;
    } else if (ctx.dbUser?.language) {
      resolvedLang = normalizeLanguage(ctx.dbUser.language);
      if (ctx.session) {
        ctx.session.language = resolvedLang;
      }
    } else if (ctx.from?.language_code) {
      resolvedLang = normalizeLanguage(ctx.from.language_code);
    }

    ctx.lang = resolvedLang;
    ctx.t = (key: TranslationKey, params?: Record<string, string | number>) =>
      t(resolvedLang, key, params);

    return next();
  };
}
