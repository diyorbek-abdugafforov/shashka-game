import type { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { verifyTelegramInitData, type VerifiedTelegramData } from '../utils/telegram.js';
import { getConfig } from '../config.js';
import type { AuthenticatedUser, JwtTokenPayload } from '../types.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
    optionalAuthenticate: (req: any, reply: any) => Promise<void>;
    generateAccessToken: (user: AuthenticatedUser) => string;
    generateRefreshToken: (user: AuthenticatedUser) => string;
    verifyTelegram: (initData: string, botToken?: string) => VerifiedTelegramData;
  }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  const config = getConfig();

  fastify.decorateRequest('user', null as any);
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('optionalAuthenticate', optionalAuthenticate);

  fastify.decorate('generateAccessToken', (user: AuthenticatedUser): string => {
    const payload: JwtTokenPayload = {
      userId: user.id,
      role: user.role,
      telegramId: user.telegramId ?? undefined,
      type: 'access',
    };
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRATION as any,
    });
  });

  fastify.decorate('generateRefreshToken', (user: AuthenticatedUser): string => {
    const payload: JwtTokenPayload = {
      userId: user.id,
      role: user.role,
      telegramId: user.telegramId ?? undefined,
      type: 'refresh',
    };
    return jwt.sign(payload, config.SESSION_SECRET, {
      expiresIn: `${config.REFRESH_TOKEN_EXPIRATION_DAYS}d` as any,
    });
  });

  fastify.decorate('verifyTelegram', (initData: string, botToken?: string) => {
    return verifyTelegramInitData(initData, botToken);
  });
};

export default authPlugin;
