import { apiClient } from './client';
import {
  GameMode,
  GameResult,
  GameStatus,
  PlayerColor,
  ResultReason,
  UserRole,
  type GameDetailsResponse,
  type GameListQuery,
  type GameModel,
  type PaginatedResponse,
  type UserModel,
  type MoveModel,
} from '@shashka/shared-types';

export interface GameListItem extends GameModel {
  whitePlayer?: UserModel | null;
  blackPlayer?: UserModel | null;
}

export const gamesApi = {
  getGames: async (params?: GameListQuery): Promise<PaginatedResponse<GameListItem>> => {
    try {
      return await apiClient.get<PaginatedResponse<GameListItem>>('/admin/games', {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        status: params?.status,
        mode: params?.mode,
        userId: params?.userId,
      });
    } catch {
      return getMockGames(params);
    }
  },

  getGameById: async (gameId: string): Promise<GameDetailsResponse> => {
    try {
      return await apiClient.get<GameDetailsResponse>(`/admin/games/${gameId}`);
    } catch {
      return getMockGameDetail(gameId);
    }
  },

  abortGame: async (gameId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(`/admin/games/${gameId}/abort`, { reason });
  },
};

function getMockGames(params?: GameListQuery): PaginatedResponse<GameListItem> {
  const mockGames: GameListItem[] = [
    {
      id: 'g-101',
      mode: GameMode.CLASSIC,
      status: GameStatus.FINISHED,
      result: GameResult.WHITE_WON,
      resultReason: ResultReason.ALL_PIECES_CAPTURED,
      whitePlayerId: 'u-101',
      blackPlayerId: 'u-102',
      winnerId: 'u-101',
      currentTurn: PlayerColor.WHITE,
      boardState: { matrix: [] },
      moveCount: 42,
      startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isRated: true,
      config: { timeControl: { initialSeconds: 300, incrementSeconds: 2 }, isGiveaway: false, rated: true },
      whiteTimeLeftMs: 120000,
      blackTimeLeftMs: 15000,
      whitePlayer: {
        id: 'u-101',
        displayName: 'Javohir Sindarov',
        username: 'grandmaster_uz',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.USER,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
      },
      blackPlayer: {
        id: 'u-102',
        displayName: 'Temur Aliyev',
        username: 'shashka_king',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.ADMIN,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-02-14T08:30:00Z',
        updatedAt: '2026-10-16T09:00:00Z',
      },
    },
    {
      id: 'g-102',
      mode: GameMode.BLITZ,
      status: GameStatus.IN_PROGRESS,
      result: null,
      resultReason: null,
      whitePlayerId: 'u-104',
      blackPlayerId: 'u-101',
      winnerId: null,
      currentTurn: PlayerColor.BLACK,
      boardState: { matrix: [] },
      moveCount: 18,
      startedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      finishedAt: null,
      isRated: true,
      config: { timeControl: { initialSeconds: 180, incrementSeconds: 1 }, isGiveaway: false, rated: true },
      whiteTimeLeftMs: 95000,
      blackTimeLeftMs: 110000,
      whitePlayer: {
        id: 'u-104',
        displayName: 'Nodira Salimova',
        username: 'nodira_shashka',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.MODERATOR,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-03-21T18:00:00Z',
        updatedAt: '2026-10-14T11:45:00Z',
      },
      blackPlayer: {
        id: 'u-101',
        displayName: 'Javohir Sindarov',
        username: 'grandmaster_uz',
        avatarUrl: null,
        language: 'uz',
        role: UserRole.USER,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-10-15T10:00:00Z',
      },
    },
    {
      id: 'g-103',
      mode: GameMode.GIVEAWAY,
      status: GameStatus.FINISHED,
      result: GameResult.DRAW,
      resultReason: ResultReason.DRAW_AGREEMENT,
      whitePlayerId: 'u-102',
      blackPlayerId: 'u-104',
      winnerId: null,
      currentTurn: PlayerColor.WHITE,
      boardState: { matrix: [] },
      moveCount: 56,
      startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      isRated: false,
      config: { timeControl: { initialSeconds: 600, incrementSeconds: 5 }, isGiveaway: true, rated: false },
      whiteTimeLeftMs: 230000,
      blackTimeLeftMs: 180000,
    },
  ];

  let filtered = mockGames;
  if (params?.status) {
    filtered = filtered.filter((g) => g.status === params.status);
  }
  if (params?.mode) {
    filtered = filtered.filter((g) => g.mode === params.mode);
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items = filtered.slice((page - 1) * limit, page * limit);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

function getMockGameDetail(gameId: string): GameDetailsResponse {
  const moves: MoveModel[] = [
    { id: 'm-1', gameId, moveNumber: 1, player: PlayerColor.WHITE, from: { row: 5, col: 2 }, to: { row: 4, col: 3 }, captures: [], isPromotion: false, notation: 'c3-d4', timestamp: '2026-10-16T14:15:10Z' },
    { id: 'm-2', gameId, moveNumber: 2, player: PlayerColor.BLACK, from: { row: 2, col: 3 }, to: { row: 3, col: 2 }, captures: [], isPromotion: false, notation: 'd6-c5', timestamp: '2026-10-16T14:15:15Z' },
    { id: 'm-3', gameId, moveNumber: 3, player: PlayerColor.WHITE, from: { row: 5, col: 4 }, to: { row: 4, col: 5 }, captures: [], isPromotion: false, notation: 'e3-f4', timestamp: '2026-10-16T14:15:24Z' },
    { id: 'm-4', gameId, moveNumber: 4, player: PlayerColor.BLACK, from: { row: 2, col: 5 }, to: { row: 3, col: 4 }, captures: [], isPromotion: false, notation: 'f6-e5', timestamp: '2026-10-16T14:15:30Z' },
    { id: 'm-5', gameId, moveNumber: 5, player: PlayerColor.WHITE, from: { row: 4, col: 3 }, to: { row: 2, col: 5 }, captures: [{ row: 3, col: 4 }], isPromotion: false, notation: 'd4:f6', timestamp: '2026-10-16T14:15:35Z' },
  ];

  return {
    game: {
      id: gameId,
      mode: GameMode.CLASSIC,
      status: GameStatus.FINISHED,
      result: GameResult.WHITE_WON,
      resultReason: ResultReason.ALL_PIECES_CAPTURED,
      whitePlayerId: 'u-101',
      blackPlayerId: 'u-102',
      winnerId: 'u-101',
      currentTurn: PlayerColor.WHITE,
      boardState: { matrix: [] },
      moveCount: 42,
      startedAt: '2026-10-16T14:15:00.000Z',
      finishedAt: '2026-10-16T14:30:00.000Z',
      isRated: true,
      config: { timeControl: { initialSeconds: 300, incrementSeconds: 2 }, isGiveaway: false, rated: true },
      whiteTimeLeftMs: 120000,
      blackTimeLeftMs: 15000,
    },
    moves,
    whitePlayer: {
      id: 'u-101',
      displayName: 'Javohir Sindarov',
      username: 'grandmaster_uz',
      avatarUrl: null,
      language: 'uz',
      role: UserRole.USER,
      isBot: false,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-10-15T10:00:00Z',
    },
    blackPlayer: {
      id: 'u-102',
      displayName: 'Temur Aliyev',
      username: 'shashka_king',
      avatarUrl: null,
      language: 'uz',
      role: UserRole.ADMIN,
      isBot: false,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-02-14T08:30:00Z',
      updatedAt: '2026-10-16T09:00:00Z',
    },
  };
}
