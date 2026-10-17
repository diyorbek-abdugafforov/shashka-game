import { getConfig as getBaseConfig, isDev, isProd, isTest } from '@shashka/config';

let cachedApiConfig: ReturnType<typeof buildApiConfig> | null = null;

function buildApiConfig() {
  const base = getBaseConfig();

  const corsOrigins = [
    base.WEB_URL,
    base.ADMIN_URL,
    base.APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].filter(Boolean);

  return {
    ...base,
    PORT: base.API_PORT || 4000,
    HOST: '0.0.0.0',
    CORS_ORIGINS: corsOrigins,
    JWT_EXPIRATION: '7d',
    REFRESH_TOKEN_EXPIRATION_DAYS: 30,
    TELEGRAM_AUTH_MAX_AGE_SECONDS: 86400, // 24 hours
  };
}

export function getConfig() {
  if (!cachedApiConfig) {
    cachedApiConfig = buildApiConfig();
  }
  return cachedApiConfig;
}

export const config = getConfig();
export { isDev, isProd, isTest };
export default config;
