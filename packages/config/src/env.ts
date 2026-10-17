import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Application URLs
  APP_URL: z.string().url().default('http://localhost:3000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),
  ADMIN_URL: z.string().url().default('http://localhost:3001'),

  // Server Ports
  API_PORT: z.coerce.number().int().default(4000),
  WEB_PORT: z.coerce.number().int().default(3000),
  ADMIN_PORT: z.coerce.number().int().default(3001),

  // Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_BOT_USERNAME: z.string().min(1).default('RussianCheckersBot'),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16).default('development_webhook_secret_key_32chars'),

  // Databases
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional().default(''),

  // Security Secrets
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  // Admin Telegram IDs (comma-separated string parsed into array of strings)
  ADMIN_TELEGRAM_IDS: z
    .string()
    .default('')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // Observability & Logging
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;
