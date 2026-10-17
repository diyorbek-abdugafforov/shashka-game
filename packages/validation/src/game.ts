import { z } from 'zod';
import { GameMode, PlayerColor, GameStatus } from '@shashka/shared-types';

export const boardCoordinateSchema = z.object({
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(7),
});

export const gameMoveSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  from: boardCoordinateSchema,
  to: boardCoordinateSchema,
  sequence: z.array(boardCoordinateSchema).optional(),
});

export const timeControlSchema = z.object({
  initialSeconds: z.number().int().min(10).max(3600), // 10s to 60 mins
  incrementSeconds: z.number().int().min(0).max(60),
});

export const createGameSchema = z.object({
  mode: z.nativeEnum(GameMode).default(GameMode.CLASSIC),
  timeControl: timeControlSchema.default({
    initialSeconds: 180,
    incrementSeconds: 2,
  }),
  rated: z.boolean().default(true),
  opponentId: z.string().uuid().optional(),
  preferredColor: z.nativeEnum(PlayerColor).optional(),
});

export const gameInvitationSchema = z.object({
  targetUserId: z.string().uuid(),
  mode: z.nativeEnum(GameMode),
  timeControl: timeControlSchema,
  rated: z.boolean().default(true),
});

export const respondInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  accept: z.boolean(),
});

export const gameListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  userId: z.string().uuid().optional(),
  status: z.nativeEnum(GameStatus).optional(),
  mode: z.nativeEnum(GameMode).optional(),
});

export type BoardCoordinateInput = z.infer<typeof boardCoordinateSchema>;
export type GameMoveInput = z.infer<typeof gameMoveSchema>;
export type TimeControlInput = z.infer<typeof timeControlSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type GameInvitationInput = z.infer<typeof gameInvitationSchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
export type GameListQueryInput = z.infer<typeof gameListQuerySchema>;
