import type { Context, SessionFlavor } from 'grammy';
import type { MenuFlavor } from '@grammyjs/menu';
import type { User, TelegramAccount } from '@shashka/database';
import type { SupportedLanguage, TranslationKey } from './i18n/index.js';

export interface BotSession {
  language: SupportedLanguage;
  notificationsEnabled: boolean;
  pendingInvitationId?: string;
  rateLimit?: {
    count: number;
    resetAt: number;
  };
}

export type DbUserWithTelegram = User & {
  telegramAccount: TelegramAccount | null;
};

export interface BotCustomProperties {
  dbUser: DbUserWithTelegram | null;
  lang: SupportedLanguage;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isAdmin: boolean;
}

export type BotContext = Context & SessionFlavor<BotSession> & MenuFlavor & BotCustomProperties;

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface UserStatsResult {
  userId: string;
  displayName: string;
  username: string | null;
  rating: number;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winrate: number;
  balance: number;
  referralsCount: number;
  referralLink: string;
}
