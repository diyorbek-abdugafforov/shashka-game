import crypto from 'node:crypto';
import { UnauthorizedError } from './errors.js';
import { getConfig } from '../config.js';

export interface TelegramUserParsed {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface VerifiedTelegramData {
  user: TelegramUserParsed;
  authDate: Date;
  queryId?: string;
  chatType?: string;
  chatInstance?: string;
  startParam?: string;
  rawParams: Record<string, string>;
}

/**
 * Validates Telegram Mini App initData according to the official Telegram documentation:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken?: string,
): VerifiedTelegramData {
  const token = botToken || getConfig().TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new UnauthorizedError('Bot token is not configured on the server');
  }

  if (!initData || typeof initData !== 'string') {
    throw new UnauthorizedError('Telegram initData is required');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new UnauthorizedError('Telegram initData missing hash signature');
  }

  // Remove hash from parameters to construct data-check-string
  params.delete('hash');

  // Sort remaining parameters in alphabetical order
  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    entries.push([key, value]);
  });
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  // Secret key: HMAC-SHA256 of bot token with key "WebAppData"
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(token)
    .digest();

  // Calculated hash: HMAC-SHA256 of data-check-string with secretKey
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Safe timing comparison
  const calculatedBuffer = Buffer.from(calculatedHash, 'hex');
  const providedBuffer = Buffer.from(hash, 'hex');

  if (
    calculatedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(calculatedBuffer, providedBuffer)
  ) {
    throw new UnauthorizedError('Invalid Telegram initData signature');
  }

  // Check auth_date freshness (maximum 24 hours)
  const authDateStr = params.get('auth_date');
  if (!authDateStr) {
    throw new UnauthorizedError('Missing auth_date in Telegram initData');
  }

  const authTimestamp = parseInt(authDateStr, 10);
  if (isNaN(authTimestamp)) {
    throw new UnauthorizedError('Invalid auth_date format');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = getConfig().TELEGRAM_AUTH_MAX_AGE_SECONDS; // 86400 (24h)

  if (nowSeconds - authTimestamp > maxAge) {
    throw new UnauthorizedError('Telegram initData is expired (auth_date older than 24 hours)');
  }

  // Extract user payload
  const userJson = params.get('user');
  if (!userJson) {
    throw new UnauthorizedError('Telegram initData missing user field');
  }

  let user: TelegramUserParsed;
  try {
    user = JSON.parse(userJson);
  } catch {
    throw new UnauthorizedError('Failed to parse Telegram user data');
  }

  if (!user.id || !user.first_name) {
    throw new UnauthorizedError('Incomplete Telegram user information');
  }

  const rawParams: Record<string, string> = {};
  entries.forEach(([k, v]) => {
    rawParams[k] = v;
  });

  return {
    user,
    authDate: new Date(authTimestamp * 1000),
    queryId: params.get('query_id') ?? undefined,
    chatType: params.get('chat_type') ?? undefined,
    chatInstance: params.get('chat_instance') ?? undefined,
    startParam: params.get('start_param') ?? undefined,
    rawParams,
  };
}
