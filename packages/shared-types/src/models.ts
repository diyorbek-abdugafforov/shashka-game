import type {
  GameMode,
  GameResult,
  GameStatus,
  PlayerColor,
  PieceType,
  ResultReason,
  UserRole,
  FriendshipStatus,
  InvitationStatus,
  WalletTransactionType,
  ShopItemCategory,
  ReportReason,
  ReportStatus,
  AdminActionType,
} from './enums.js';

export interface BoardCoordinate {
  row: number; // 0 to 7
  col: number; // 0 to 7
}

export interface PieceState {
  color: PlayerColor;
  type: PieceType;
}

export type BoardMatrix = (PieceState | null)[][];

export interface SerializedBoard {
  matrix: BoardMatrix;
}

export interface GameTimeControl {
  initialSeconds: number;
  incrementSeconds: number;
}

export interface GameConfig {
  timeControl: GameTimeControl;
  isGiveaway: boolean;
  rated: boolean;
  drawRuleFiftyMoves?: boolean;
}

export interface UserSummary {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  isBot: boolean;
  isBanned: boolean;
}

export interface UserModel {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  language: string;
  role: UserRole;
  isBot: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramAccountModel {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  languageCode: string | null;
  userId: string;
}

export interface SessionModel {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastActiveAt: string;
  isRevoked: boolean;
}

export interface MoveStep {
  from: BoardCoordinate;
  to: BoardCoordinate;
  captured?: BoardCoordinate;
}

export interface MoveModel {
  id: string;
  gameId: string;
  moveNumber: number;
  player: PlayerColor;
  from: BoardCoordinate;
  to: BoardCoordinate;
  captures: BoardCoordinate[];
  isPromotion: boolean;
  notation: string;
  timestamp: string;
  timeLeftWhiteMs?: number;
  timeLeftBlackMs?: number;
}

export interface GameModel {
  id: string;
  mode: GameMode;
  status: GameStatus;
  result: GameResult | null;
  resultReason: ResultReason | null;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  winnerId: string | null;
  currentTurn: PlayerColor;
  boardState: SerializedBoard;
  moveCount: number;
  startedAt: string;
  finishedAt: string | null;
  isRated: boolean;
  config: GameConfig;
  whiteTimeLeftMs: number;
  blackTimeLeftMs: number;
}

export interface RatingHistoryModel {
  id: string;
  userId: string;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  change: number;
  gameId: string | null;
  timestamp: string;
}

export interface FriendshipModel {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string;
}

export interface GameInvitationModel {
  id: string;
  fromUserId: string;
  toUserId: string;
  gameMode: GameMode;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface ReferralModel {
  id: string;
  referrerId: string;
  referredId: string;
  rewardGiven: boolean;
  createdAt: string;
}

export interface WalletModel {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionModel {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface ShopItemModel {
  id: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  price: number;
  imageUrl: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface UserInventoryModel {
  id: string;
  userId: string;
  itemId: string;
  acquiredAt: string;
  isEquipped: boolean;
}

export interface ReportModel {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  reportedGameId: string | null;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminActionModel {
  id: string;
  adminId: string;
  action: AdminActionType;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface SystemSettingModel {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FeatureFlagModel {
  id: string;
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
}
