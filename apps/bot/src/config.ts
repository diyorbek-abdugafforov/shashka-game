import { getConfig, isDev, isProd, type Env } from '@shashka/config';

export interface BotConfig extends Env {
  BOT_PORT: number;
  WEBHOOK_PATH: string;
  WEBHOOK_DOMAIN: string;
  REFERRAL_BONUS_COINS: number;
  INVITATION_EXPIRY_MINUTES: number;
}

let cachedBotConfig: BotConfig | null = null;

export function getBotConfig(): BotConfig {
  if (cachedBotConfig) {
    return cachedBotConfig;
  }

  const baseConfig = getConfig();

  const botPort = Number(process.env.BOT_PORT || process.env.PORT || 4001);
  const webhookPath = process.env.WEBHOOK_PATH || '/webhook/telegram';
  const webhookDomain = process.env.WEBHOOK_DOMAIN || baseConfig.APP_URL || '';
  const referralBonusCoins = Number(process.env.REFERRAL_BONUS_COINS || 50);
  const invitationExpiryMinutes = Number(process.env.INVITATION_EXPIRY_MINUTES || 15);

  cachedBotConfig = {
    ...baseConfig,
    BOT_PORT: botPort,
    WEBHOOK_PATH: webhookPath,
    WEBHOOK_DOMAIN: webhookDomain,
    REFERRAL_BONUS_COINS: referralBonusCoins,
    INVITATION_EXPIRY_MINUTES: invitationExpiryMinutes,
  };

  return cachedBotConfig;
}

export { isDev, isProd };
