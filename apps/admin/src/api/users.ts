import { apiClient } from './client';
import {
  UserRole,
  WalletTransactionType,
  type AdminAdjustBalanceRequest,
  type AdminBanUserRequest,
  type AdminUnbanUserRequest,
  type AdminUpdateRoleRequest,
  type AdminUserFilterQuery,
  type PaginatedResponse,
  type RatingHistoryModel,
  type TelegramAccountModel,
  type UserModel,
  type UserStatsResponse,
  type WalletModel,
  type WalletTransactionModel,
  type GameModel,
} from '@shashka/shared-types';

export interface UserListItem extends UserModel {
  telegramAccount?: TelegramAccountModel | null;
  rating: number;
  gamesPlayed: number;
  walletBalance: number;
}

export interface UserDetailData {
  user: UserModel;
  telegramAccount: TelegramAccountModel | null;
  stats: UserStatsResponse;
  wallet: WalletModel | null;
  transactions: WalletTransactionModel[];
  ratingHistory: RatingHistoryModel[];
  recentGames: GameModel[];
  adminNotes: {
    id: string;
    adminName: string;
    note: string;
    createdAt: string;
  }[];
}

export const usersApi = {
  getUsers: async (params?: AdminUserFilterQuery): Promise<PaginatedResponse<UserListItem>> => {
    try {
      return await apiClient.get<PaginatedResponse<UserListItem>>('/admin/users', {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        role: params?.role,
        isBanned: params?.isBanned,
      });
    } catch {
      return getMockUsers(params);
    }
  },

  getUserById: async (userId: string): Promise<UserDetailData> => {
    try {
      return await apiClient.get<UserDetailData>(`/admin/users/${userId}`);
    } catch {
      return getMockUserDetail(userId);
    }
  },

  banUser: async (data: AdminBanUserRequest): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(`/admin/users/${data.userId}/ban`, data);
  },

  unbanUser: async (data: AdminUnbanUserRequest): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(`/admin/users/${data.userId}/unban`, data);
  },

  adjustWallet: async (data: AdminAdjustBalanceRequest): Promise<{ success: boolean; newBalance: number }> => {
    return await apiClient.post<{ success: boolean; newBalance: number }>(`/admin/users/${data.userId}/wallet/adjust`, data);
  },

  updateRole: async (data: AdminUpdateRoleRequest): Promise<{ success: boolean; user: UserModel }> => {
    return await apiClient.post<{ success: boolean; user: UserModel }>(`/admin/users/${data.userId}/role`, data);
  },

  addAdminNote: async (userId: string, note: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.post<{ success: boolean; id: string }>(`/admin/users/${userId}/notes`, { note });
  },
};

// ----------------------------------------------------
// Mock Data Helpers for Dev / Offline Resilience
// ----------------------------------------------------

function getMockUsers(params?: AdminUserFilterQuery): PaginatedResponse<UserListItem> {
  const allMockUsers: UserListItem[] = [
    {
      id: 'u-101',
      username: 'grandmaster_uz',
      displayName: 'Javohir Sindarov',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      language: 'uz',
      role: UserRole.USER,
      isBot: false,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
      rating: 1845,
      gamesPlayed: 320,
      walletBalance: 2450,
      telegramAccount: {
        id: 'tg-101',
        telegramId: '123456789',
        firstName: 'Javohir',
        lastName: 'Sindarov',
        username: 'javohir_uz',
        photoUrl: null,
        languageCode: 'uz',
        userId: 'u-101',
      },
    },
    {
      id: 'u-102',
      username: 'shashka_king',
      displayName: 'Temur Aliyev',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      language: 'uz',
      role: UserRole.ADMIN,
      isBot: false,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-02-14T08:30:00.000Z',
      updatedAt: '2026-10-16T09:00:00.000Z',
      rating: 1620,
      gamesPlayed: 184,
      walletBalance: 12000,
      telegramAccount: {
        id: 'tg-102',
        telegramId: '987654321',
        firstName: 'Temur',
        lastName: 'Aliyev',
        username: 'temur_a',
        photoUrl: null,
        languageCode: 'uz',
        userId: 'u-102',
      },
    },
    {
      id: 'u-103',
      username: 'cheater_bot_9',
      displayName: 'ToxicPlayer2026',
      avatarUrl: null,
      language: 'ru',
      role: UserRole.USER,
      isBot: false,
      isBanned: true,
      bannedUntil: '2026-11-01T00:00:00.000Z',
      banReason: 'Dasturiy vositalardan foydalanish (Engine use)',
      createdAt: '2026-05-19T14:20:00.000Z',
      updatedAt: '2026-10-10T16:00:00.000Z',
      rating: 1910,
      gamesPlayed: 45,
      walletBalance: 0,
      telegramAccount: {
        id: 'tg-103',
        telegramId: '554433221',
        firstName: 'Max',
        lastName: null,
        username: 'cheater_bot_9',
        photoUrl: null,
        languageCode: 'ru',
        userId: 'u-103',
      },
    },
    {
      id: 'u-104',
      username: 'nodira_shashka',
      displayName: 'Nodira Salimova',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      language: 'uz',
      role: UserRole.MODERATOR,
      isBot: false,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-03-21T18:00:00.000Z',
      updatedAt: '2026-10-14T11:45:00.000Z',
      rating: 1490,
      gamesPlayed: 112,
      walletBalance: 4800,
      telegramAccount: {
        id: 'tg-104',
        telegramId: '778899001',
        firstName: 'Nodira',
        lastName: 'Salimova',
        username: 'nodira_s',
        photoUrl: null,
        languageCode: 'uz',
        userId: 'u-104',
      },
    },
    {
      id: 'u-105',
      username: 'bot_easy',
      displayName: 'Oddiy Bot (Bot Easy)',
      avatarUrl: null,
      language: 'uz',
      role: UserRole.USER,
      isBot: true,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-16T12:00:00.000Z',
      rating: 1150,
      gamesPlayed: 9400,
      walletBalance: 0,
    },
  ];

  let filtered = allMockUsers;
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.telegramAccount?.telegramId && u.telegramAccount.telegramId.includes(q)),
    );
  }
  if (params?.role) {
    filtered = filtered.filter((u) => u.role === params.role);
  }
  if (params?.isBanned !== undefined) {
    filtered = filtered.filter((u) => u.isBanned === params.isBanned);
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

function getMockUserDetail(userId: string): UserDetailData {
  return {
    user: {
      id: userId,
      username: 'grandmaster_uz',
      displayName: 'Javohir Sindarov',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      language: 'uz',
      role: UserRole.USER,
      isBot: false,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
    telegramAccount: {
      id: 'tg-101',
      telegramId: '123456789',
      firstName: 'Javohir',
      lastName: 'Sindarov',
      username: 'javohir_uz',
      photoUrl: null,
      languageCode: 'uz',
      userId,
    },
    stats: {
      userId,
      gamesPlayed: 320,
      wins: 210,
      losses: 80,
      draws: 30,
      winRate: 65.6,
      currentRating: 1845,
      peakRating: 1890,
      rank: 4,
    },
    wallet: {
      id: 'w-101',
      userId,
      balance: 2450,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
    transactions: [
      {
        id: 'tx-1',
        walletId: 'w-101',
        type: WalletTransactionType.GAME_REWARD,
        amount: 50,
        balanceAfter: 2450,
        description: 'Reytingli oʻyin gʻalabasi uchun mukofot',
        referenceId: 'g-101',
        referenceType: 'GAME',
        createdAt: '2026-10-16T14:30:00.000Z',
      },
      {
        id: 'tx-2',
        walletId: 'w-101',
        type: WalletTransactionType.SHOP_PURCHASE,
        amount: -300,
        balanceAfter: 2400,
        description: 'Yogʻoch shashka taxtasi xaridi',
        referenceId: 'item-2',
        referenceType: 'SHOP_ITEM',
        createdAt: '2026-10-15T18:20:00.000Z',
      },
      {
        id: 'tx-3',
        walletId: 'w-101',
        type: WalletTransactionType.ADMIN_ADJUSTMENT,
        amount: 1000,
        balanceAfter: 2700,
        description: 'Turnir sovrini uchun hisob toʻldirish',
        referenceId: null,
        referenceType: null,
        createdAt: '2026-10-12T10:00:00.000Z',
      },
    ],
    ratingHistory: [
      { id: 'rh-1', userId, rating: 1720, ratingDeviation: 45, volatility: 0.06, change: 15, gameId: 'g-91', timestamp: '2026-10-10T12:00:00.000Z' },
      { id: 'rh-2', userId, rating: 1765, ratingDeviation: 42, volatility: 0.06, change: 45, gameId: 'g-92', timestamp: '2026-10-12T15:00:00.000Z' },
      { id: 'rh-3', userId, rating: 1750, ratingDeviation: 40, volatility: 0.06, change: -15, gameId: 'g-95', timestamp: '2026-10-14T18:00:00.000Z' },
      { id: 'rh-4', userId, rating: 1810, ratingDeviation: 38, volatility: 0.05, change: 60, gameId: 'g-99', timestamp: '2026-10-15T11:00:00.000Z' },
      { id: 'rh-5', userId, rating: 1845, ratingDeviation: 35, volatility: 0.05, change: 35, gameId: 'g-101', timestamp: '2026-10-16T14:00:00.000Z' },
    ],
    recentGames: [
      {
        id: 'g-101',
        mode: 'CLASSIC' as any,
        status: 'FINISHED' as any,
        result: 'WHITE_WON' as any,
        resultReason: 'ALL_PIECES_CAPTURED' as any,
        whitePlayerId: userId,
        blackPlayerId: 'u-102',
        winnerId: userId,
        currentTurn: 'WHITE' as any,
        boardState: { matrix: [] },
        moveCount: 38,
        startedAt: '2026-10-16T14:15:00.000Z',
        finishedAt: '2026-10-16T14:30:00.000Z',
        isRated: true,
        config: { timeControl: { initialSeconds: 300, incrementSeconds: 2 }, isGiveaway: false, rated: true },
        whiteTimeLeftMs: 140000,
        blackTimeLeftMs: 20000,
      },
    ],
    adminNotes: [
      {
        id: 'note-1',
        adminName: 'Super Admin',
        note: 'Foydalanuvchi birinchi rasmiy turnirda 2-oʻrinni egalladi',
        createdAt: '2026-10-12T10:05:00.000Z',
      },
    ],
  };
}
