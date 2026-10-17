import type {
  GameMode,
  GameStatus,
  PlayerColor,
  ReportReason,
  ReportStatus,
  UserRole,
} from './enums.js';
import type {
  GameModel,
  MoveModel,
  ShopItemModel,
  UserModel,
  UserInventoryModel,
  WalletModel,
} from './models.js';

// Generic API Responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginatedMeta;
}

// Authentication DTOs
export interface TelegramAuthRequest {
  initData: string; // Raw Telegram WebApp initData string
}

export interface TelegramAuthResponse {
  token: string;
  user: UserModel;
  isNewUser: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthSessionResponse {
  user: UserModel;
  wallet: WalletModel;
}

// User DTOs
export interface UpdateUserProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  language?: string;
}

export interface UserStatsResponse {
  userId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentRating: number;
  peakRating: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  gamesPlayed: number;
  winRate: number;
}

export interface LeaderboardResponse {
  mode: GameMode;
  topPlayers: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
}

// Game DTOs
export interface CreateGameRequest {
  mode: GameMode;
  timeControl: {
    initialSeconds: number;
    incrementSeconds: number;
  };
  rated: boolean;
  opponentId?: string; // Optional invite direct user
  preferredColor?: PlayerColor;
}

export interface CreateGameResponse {
  gameId: string;
  mode: GameMode;
  status: GameStatus;
  inviteCode?: string;
}

export interface GameDetailsResponse {
  game: GameModel;
  moves: MoveModel[];
  whitePlayer: UserModel | null;
  blackPlayer: UserModel | null;
}

export interface GameListQuery extends PaginationParams {
  userId?: string;
  status?: GameStatus;
  mode?: GameMode;
}

export interface CreateInvitationRequest {
  targetUserId: string;
  mode: GameMode;
  timeControl: {
    initialSeconds: number;
    incrementSeconds: number;
  };
  rated: boolean;
}

export interface RespondInvitationRequest {
  invitationId: string;
  accept: boolean;
}

// Wallet & Shop DTOs
export interface PurchaseShopItemRequest {
  itemId: string;
}

export interface EquipItemRequest {
  userInventoryId: string;
}

export interface UserInventoryResponse {
  inventory: (UserInventoryModel & { item: ShopItemModel })[];
}

export interface TransactionHistoryQuery extends PaginationParams {
  type?: string;
}

// Admin DTOs
export interface AdminUserFilterQuery extends PaginationParams {
  search?: string;
  role?: UserRole;
  isBanned?: boolean;
}

export interface AdminBanUserRequest {
  userId: string;
  reason: string;
  bannedUntil?: string; // ISO date or empty for permanent
}

export interface AdminUnbanUserRequest {
  userId: string;
  reason: string;
}

export interface AdminAdjustBalanceRequest {
  userId: string;
  amount: number;
  reason: string;
}

export interface AdminUpdateRoleRequest {
  userId: string;
  role: UserRole;
}

export interface CreateReportRequest {
  reportedUserId?: string;
  reportedGameId?: string;
  reason: ReportReason;
  description: string;
}

export interface ResolveReportRequest {
  reportId: string;
  status: ReportStatus;
  actionNote?: string;
}

export interface UpdateSystemSettingRequest {
  key: string;
  value: string;
  description?: string;
}

export interface ToggleFeatureFlagRequest {
  key: string;
  enabled: boolean;
}
