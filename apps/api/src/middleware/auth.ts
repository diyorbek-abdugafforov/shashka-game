import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import prisma from '@shashka/database';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { getConfig } from '../config.js';
import type { AuthenticatedUser, JwtTokenPayload } from '../types.js';

export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && (req.cookies.token || req.cookies.auth_token)) {
    token = req.cookies.token || req.cookies.auth_token;
  }

  if (!token) {
    throw new UnauthorizedError('Authentication required. Missing Bearer token.');
  }

  const config = getConfig();

  let payload: JwtTokenPayload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET) as JwtTokenPayload;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }

  if (!payload.userId) {
    throw new UnauthorizedError('Malformed token payload');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      telegramAccount: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User account not found');
  }

  if (user.isBanned) {
    if (user.bannedUntil && new Date(user.bannedUntil) < new Date()) {
      // Ban expired, unban automatically
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isBanned: false,
          bannedUntil: null,
          banReason: null,
        },
      });
      user.isBanned = false;
    } else {
      throw new ForbiddenError(
        `Account is banned. Reason: ${user.banReason || 'Violation of terms of service'}`,
      );
    }
  }

  const authUser: AuthenticatedUser = {
    id: user.id,
    telegramId: user.telegramAccount?.telegramId,
    username: user.username,
    displayName: user.displayName,
    role: user.role as any,
    isBanned: user.isBanned,
    avatarUrl: user.avatarUrl,
  };

  req.user = authUser;
}

export async function optionalAuthenticate(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && (req.cookies.token || req.cookies.auth_token)) {
    token = req.cookies.token || req.cookies.auth_token;
  }

  if (!token) return;

  try {
    const config = getConfig();
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtTokenPayload;
    if (!payload.userId) return;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        telegramAccount: true,
      },
    });

    if (user && !user.isBanned) {
      req.user = {
        id: user.id,
        telegramId: user.telegramAccount?.telegramId,
        username: user.username,
        displayName: user.displayName,
        role: user.role as any,
        isBanned: user.isBanned,
        avatarUrl: user.avatarUrl,
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
}
