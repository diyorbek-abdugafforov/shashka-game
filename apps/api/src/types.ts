import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Socket } from 'socket.io';
import type { UserRole } from '@shashka/shared-types';

export interface AuthenticatedUser {
  id: string;
  telegramId?: string | null;
  username?: string | null;
  displayName: string;
  role: UserRole;
  isBanned: boolean;
  avatarUrl?: string | null;
}

export interface JwtTokenPayload {
  userId: string;
  role: UserRole;
  telegramId?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface SocketAuthData {
  user: AuthenticatedUser;
  currentGameId?: string;
}

export type AuthenticatedSocket = Socket & {
  data: SocketAuthData;
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export type FastifyAuthPreHandler = (
  req: FastifyRequest,
  reply: FastifyReply,
) => Promise<void>;
