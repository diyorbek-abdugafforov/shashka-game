import type { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import prisma from '@shashka/database';
import { telegramAuthSchema } from '@shashka/validation';
import type { ApiResponse, TelegramAuthResponse, AuthSessionResponse, UserRole } from '@shashka/shared-types';
import { UserService } from '../services/user.service.js';
import { WalletService } from '../services/wallet.service.js';
import { verifyTelegramInitData } from '../utils/telegram.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { UnauthorizedError } from '../utils/errors.js';
import { getConfig, isDev, isProd } from '../config.js';
import type { JwtTokenPayload } from '../types.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const config = getConfig();

  // POST /api/auth/telegram
  fastify.post(
    '/telegram',
    {
      preHandler: [validateBody(telegramAuthSchema)],
    },
    async (req, reply) => {
      const { initData } = req.body as { initData: string };

      let telegramUser;

      // Development mock bypass for testing
      if (isDev() && (initData === 'mock' || initData.startsWith('mock:'))) {
        const customId = initData.startsWith('mock:')
          ? parseInt(initData.split(':')[1] || '999999999', 10)
          : 999999999;
        telegramUser = {
          id: customId,
          first_name: 'Dev',
          last_name: 'Tester',
          username: `dev_tester_${customId}`,
          language_code: 'ru',
        };
      } else {
        const verified = verifyTelegramInitData(initData);
        telegramUser = verified.user;
      }

      const { user, isNewUser } = await UserService.createOrUpdateUser(telegramUser);

      const authUser = {
        id: user.id,
        telegramId: user.telegramAccount?.telegramId,
        username: user.username,
        displayName: user.displayName,
        role: user.role as any as UserRole,
        isBanned: user.isBanned,
        avatarUrl: user.avatarUrl,
      };

      const token = fastify.generateAccessToken(authUser);
      const refreshToken = fastify.generateRefreshToken(authUser);

      // Create session in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Set cookies
      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: isProd(),
        sameSite: 'none',
        maxAge: 7 * 24 * 3600,
      });

      reply.setCookie('refresh_token', refreshToken, {
        path: '/api/auth/refresh',
        httpOnly: true,
        secure: isProd(),
        sameSite: 'none',
        maxAge: config.REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 3600,
      });

      const response: ApiResponse<TelegramAuthResponse & { refreshToken: string }> = {
        success: true,
        data: {
          token,
          refreshToken,
          isNewUser,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            language: user.language,
            role: user.role as any as UserRole,
            isBot: user.isBot,
            isBanned: user.isBanned,
            bannedUntil: user.bannedUntil ? user.bannedUntil.toISOString() : null,
            banReason: user.banReason,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      };

      return reply.send(response);
    },
  );

  // POST /api/auth/mock (Development only)
  if (isDev()) {
    fastify.post('/mock', async (req, reply) => {
      const body = (req.body as any) || {};
      const id = body.telegramId || 100000000 + Math.floor(Math.random() * 900000000);
      const mockTelegramUser = {
        id,
        first_name: body.firstName || 'Local',
        last_name: body.lastName || 'Player',
        username: body.username || `player_${id}`,
        language_code: body.language || 'ru',
      };

      const { user, isNewUser } = await UserService.createOrUpdateUser(mockTelegramUser);

      const authUser = {
        id: user.id,
        telegramId: user.telegramAccount?.telegramId,
        username: user.username,
        displayName: user.displayName,
        role: user.role as any as UserRole,
        isBanned: user.isBanned,
        avatarUrl: user.avatarUrl,
      };

      const token = fastify.generateAccessToken(authUser);
      const refreshToken = fastify.generateRefreshToken(authUser);

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });

      return reply.send({
        success: true,
        data: {
          token,
          refreshToken,
          isNewUser,
          user,
        },
      });
    });
  }

  // GET /api/auth/me
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const user = await UserService.getUserById(authUser.id);
      const balance = await WalletService.getBalance(authUser.id);

      const response: ApiResponse<AuthSessionResponse> = {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            language: user.language,
            role: user.role as any as UserRole,
            isBot: user.isBot,
            isBanned: user.isBanned,
            bannedUntil: user.bannedUntil ? user.bannedUntil.toISOString() : null,
            banReason: user.banReason,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          wallet: {
            id: user.wallet?.id ?? '',
            userId: user.id,
            balance,
            createdAt: user.wallet?.createdAt.toISOString() ?? new Date().toISOString(),
            updatedAt: user.wallet?.updatedAt.toISOString() ?? new Date().toISOString(),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      };

      return reply.send(response);
    },
  );

  // POST /api/auth/refresh
  fastify.post('/refresh', async (req, reply) => {
    let refreshToken = (req.body as any)?.refreshToken;
    if (!refreshToken && req.cookies.refresh_token) {
      refreshToken = req.cookies.refresh_token;
    }

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let payload: JwtTokenPayload;
    try {
      payload = jwt.verify(refreshToken, config.SESSION_SECRET) as JwtTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { telegramAccount: true },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedError('User account not found or banned');
    }

    const authUser = {
      id: user.id,
      telegramId: user.telegramAccount?.telegramId,
      username: user.username,
      displayName: user.displayName,
      role: user.role as any as UserRole,
      isBanned: user.isBanned,
      avatarUrl: user.avatarUrl,
    };

    const newToken = fastify.generateAccessToken(authUser);

    reply.setCookie('token', newToken, {
      path: '/',
      httpOnly: true,
      secure: isProd(),
      sameSite: 'none',
      maxAge: 7 * 24 * 3600,
    });

    return reply.send({
      success: true,
      data: {
        token: newToken,
      },
    });
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.session.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    reply.clearCookie('token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });
};

export default authRoutes;
