import { uz, type TranslationKey } from './uz.js';
import { ru } from './ru.js';
import { en } from './en.js';

export type SupportedLanguage = 'uz' | 'ru' | 'en';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'uz';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['uz', 'ru', 'en'];

export const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  uz,
  ru,
  en,
};

export function isSupportedLanguage(lang: string | undefined | null): lang is SupportedLanguage {
  if (!lang) return false;
  return SUPPORTED_LANGUAGES.includes(lang.toLowerCase() as SupportedLanguage);
}

export function normalizeLanguage(lang: string | undefined | null): SupportedLanguage {
  if (!lang) return DEFAULT_LANGUAGE;
  const clean = lang.toLowerCase().slice(0, 2);
  if (clean === 'uz') return 'uz';
  if (clean === 'ru') return 'ru';
  if (clean === 'en') return 'en';
  return DEFAULT_LANGUAGE;
}

export function t(
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dictionary = translations[lang] || translations[DEFAULT_LANGUAGE];
  let text: string = dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }

  return text;
}

export type { TranslationKey };
