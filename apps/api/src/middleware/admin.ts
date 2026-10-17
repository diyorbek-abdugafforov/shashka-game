import type { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@shashka/shared-types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { getConfig } from '../config.js';
import { authenticate } from './auth.js';

export function isUserAdminOrSuperAdmin(user: { role: UserRole; telegramId?: string | null }): boolean {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  const config = getConfig();
  if (user.telegramId && config.ADMIN_TELEGRAM_IDS.includes(user.telegramId)) {
    return true;
  }

  return false;
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) {
      await authenticate(req, reply);
    }

    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (isUserAdminOrSuperAdmin(user)) {
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      );
    }
  };
}

export const requireAdmin = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
export const requireModerator = requireRole([
  UserRole.MODERATOR,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
]);
