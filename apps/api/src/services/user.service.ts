import prisma from '@shashka/database';
import { AdminActionType, GameResult, GameStatus, UserRole } from '@shashka/shared-types';
import type { TelegramUserParsed } from '../utils/telegram.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { INITIAL_RATING, INITIAL_RD, INITIAL_VOLATILITY } from './rating.service.js';
import { getConfig } from '../config.js';

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  language?: string;
}

export class UserService {
  /**
   * Upsert user from verified Telegram authentication payload.
   */
  public static async createOrUpdateUser(telegramUser: TelegramUserParsed) {
    const telegramIdStr = String(telegramUser.id);
    const config = getConfig();

    const existingAccount = await prisma.telegramAccount.findUnique({
      where: { telegramId: telegramIdStr },
      include: { user: true },
    });

    const isDesignatedAdmin = config.ADMIN_TELEGRAM_IDS.includes(telegramIdStr);
    const assignedRole = isDesignatedAdmin ? UserRole.ADMIN : undefined;

    const displayName =
      [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') ||
      telegramUser.username ||
      `Player_${telegramUser.id}`;

    if (existingAccount) {
      // Update existing user profile if needed
      const updatedUser = await prisma.user.update({
        where: { id: existingAccount.userId },
        data: {
          username: telegramUser.username ?? existingAccount.user.username,
          displayName: existingAccount.user.displayName || displayName,
          avatarUrl: telegramUser.photo_url ?? existingAccount.user.avatarUrl,
          language: telegramUser.language_code ?? existingAccount.user.language,
          role: assignedRole ?? existingAccount.user.role,
          telegramAccount: {
            update: {
              firstName: telegramUser.first_name,
              lastName: telegramUser.last_name ?? null,
              username: telegramUser.username ?? null,
              photoUrl: telegramUser.photo_url ?? null,
              languageCode: telegramUser.language_code ?? null,
            },
          },
        },
        include: {
          telegramAccount: true,
          wallet: true,
        },
      });

      return {
        user: updatedUser,
        isNewUser: false,
      };
    }

    // Create brand new user
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: telegramUser.username ?? null,
          displayName,
          avatarUrl: telegramUser.photo_url ?? null,
          language: telegramUser.language_code || 'ru',
          role: assignedRole || UserRole.USER,
          rating: INITIAL_RATING,
          telegramAccount: {
            create: {
              telegramId: telegramIdStr,
              firstName: telegramUser.first_name,
              lastName: telegramUser.last_name ?? null,
              username: telegramUser.username ?? null,
              photoUrl: telegramUser.photo_url ?? null,
              languageCode: telegramUser.language_code ?? null,
            },
          },
          wallet: {
            create: {
              balance: 0,
            },
          },
          ratingHistory: {
            create: {
              rating: INITIAL_RATING,
              ratingDeviation: INITIAL_RD,
              volatility: INITIAL_VOLATILITY,
              change: 0,
            },
          },
        },
        include: {
          telegramAccount: true,
          wallet: true,
        },
      });

      return user;
    });

    return {
      user: newUser,
      isNewUser: true,
    };
  }

  /**
   * Retrieves user by UUID with related accounts and inventory count.
   */
  public static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        telegramAccount: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }

    return user;
  }

  /**
   * Calculates comprehensive gameplay statistics for a user.
   */
  public static async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        rating: true,
      },
    });

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    const [gamesPlayed, wins, draws, peakRatingEntry, higherRatedCount] = await Promise.all([
      // Total finished games
      prisma.game.count({
        where: {
          status: GameStatus.FINISHED,
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
      }),
      // Total wins
      prisma.game.count({
        where: {
          status: GameStatus.FINISHED,
          winnerId: userId,
        },
      }),
      // Total draws
      prisma.game.count({
        where: {
          status: GameStatus.FINISHED,
          result: GameResult.DRAW,
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
      }),
      // Peak rating in rating history
      prisma.ratingHistory.findFirst({
        where: { userId },
        orderBy: { rating: 'desc' },
        select: { rating: true },
      }),
      // Global rank: number of players with higher rating + 1
      prisma.user.count({
        where: {
          isBot: false,
          isBanned: false,
          rating: { gt: user.rating },
        },
      }),
    ]);

    const losses = Math.max(0, gamesPlayed - wins - draws);
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 10 : 0;
    const peakRating = Math.max(user.rating, peakRatingEntry?.rating ?? user.rating);
    const rank = higherRatedCount + 1;

    return {
      userId,
      gamesPlayed,
      wins,
      losses,
      draws,
      winRate,
      currentRating: user.rating,
      peakRating,
      rank,
    };
  }

  /**
   * Updates user profile fields.
   */
  public static async updateProfile(id: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }

    return prisma.user.update({
      where: { id },
      data: {
        displayName: data.displayName ?? undefined,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
        language: data.language ?? undefined,
      },
      include: {
        telegramAccount: true,
        wallet: true,
      },
    });
  }

  /**
   * Bans a user and logs the admin action.
   */
  public static async banUser(
    targetUserId: string,
    adminId: string,
    reason: string,
    bannedUntil?: Date | null,
  ) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundError(`User ${targetUserId} not found`);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestError('Cannot ban a SUPER_ADMIN account');
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: {
          isBanned: true,
          banReason: reason,
          bannedUntil: bannedUntil ?? null,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId,
          action: AdminActionType.BAN_USER,
          targetType: 'USER',
          targetId: targetUserId,
          details: {
            reason,
            bannedUntil: bannedUntil ? bannedUntil.toISOString() : null,
          },
        },
      });

      return updatedUser;
    });
  }

  /**
   * Unbans a user and logs the admin action.
   */
  public static async unbanUser(targetUserId: string, adminId: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundError(`User ${targetUserId} not found`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: {
          isBanned: false,
          banReason: null,
          bannedUntil: null,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId,
          action: AdminActionType.UNBAN_USER,
          targetType: 'USER',
          targetId: targetUserId,
          details: {
            reason: reason || 'Unbanned by admin',
          },
        },
      });

      return updatedUser;
    });
  }
}

export default UserService;
