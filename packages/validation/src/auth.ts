import { z } from 'zod';

export const telegramAuthSchema = z.object({
  initData: z.string().min(1, 'Telegram initData cannot be empty'),
});

export const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  photo_url: z.string().url().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type TelegramAuthInput = z.infer<typeof telegramAuthSchema>;
export type TelegramUserInput = z.infer<typeof telegramUserSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
