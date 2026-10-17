import { prisma, UserRole, WalletTransactionType, type User, type TelegramAccount } from '@shashka/database';
import { getBotConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { normalizeLanguage, type SupportedLanguage } from '../i18n/index.js';
import type { TelegramUserData, DbUserWithTelegram, UserStatsResult } from '../types.js';

export interface UserRegistrationResult {
  user: DbUserWithTelegram;
  isNewUser: boolean;
  referrer: (User & { telegramAccount: TelegramAccount | null }) | null;
  referralRewardAmount: number;
}

export class UserService {
  /**
   * Find existing user by Telegram ID or create a new user profile with
   * associated Telegram account and initial wallet.
   */
  static async findOrCreateTelegramUser(
    tgUser: TelegramUserData,
    referrerParam?: string,
  ): Promise<UserRegistrationResult> {
    const config = getBotConfig();
    const strTelegramId = String(tgUser.id);
    const isAdmin = config.ADMIN_TELEGRAM_IDS.includes(strTelegramId);
    const userLang = normalizeLanguage(tgUser.language_code);
    const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || `Player ${tgUser.id}`;

    try {
      // 1. Check if user already exists
      const existingAccount = await prisma.telegramAccount.findUnique({
        where: { telegramId: strTelegramId },
        include: { user: { include: { telegramAccount: true } } },
      });

      if (existingAccount && existingAccount.user) {
        // Update any changed profile data in background
        const needsUpdate =
          existingAccount.firstName !== tgUser.first_name ||
          existingAccount.lastName !== (tgUser.last_name || null) ||
          existingAccount.username !== (tgUser.username || null) ||
          existingAccount.photoUrl !== (tgUser.photo_url || null);

        if (needsUpdate) {
          await prisma.telegramAccount.update({
            where: { id: existingAccount.id },
            data: {
              firstName: tgUser.first_name,
              lastName: tgUser.last_name || null,
              username: tgUser.username || null,
              photoUrl: tgUser.photo_url || null,
              languageCode: tgUser.language_code || null,
            },
          });
        }

        return {
          user: existingAccount.user,
          isNewUser: false,
          referrer: null,
          referralRewardAmount: 0,
        };
      }

      // 2. Identify referrer if present
      let referrer: (User & { telegramAccount: TelegramAccount | null }) | null = null;
      if (referrerParam) {
        const cleanRef = referrerParam.replace(/^(ref_|ref=)/i, '').trim();
        if (cleanRef) {
          // Check by user ID first (UUID)
          referrer = await prisma.user.findFirst({
            where: {
              OR: [
                { id: cleanRef },
                { telegramAccount: { telegramId: cleanRef } },
              ],
            },
            include: { telegramAccount: true },
          });
        }
      }

      // 3. Create user, telegram account, and initial wallet in a transaction
      const newUser = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            username: tgUser.username || null,
            displayName,
            language: userLang,
            role: isAdmin ? UserRole.ADMIN : UserRole.USER,
            rating: 1200,
            telegramAccount: {
              create: {
                telegramId: strTelegramId,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name || null,
                username: tgUser.username || null,
                photoUrl: tgUser.photo_url || null,
                languageCode: tgUser.language_code || null,
              },
            },
            wallet: {
              create: {
                balance: 100, // Initial starter tokens
              },
            },
          },
          include: {
            telegramAccount: true,
          },
        });

        // Initial welcome bonus transaction log
        const userWallet = await tx.wallet.findUnique({
          where: { userId: createdUser.id },
        });

        if (userWallet) {
          await tx.walletTransaction.create({
            data: {
              walletId: userWallet.id,
              type: WalletTransactionType.DAILY_REWARD,
              amount: 100,
              balanceAfter: 100,
              description: 'Xush kelibsiz bonusi / Starter welcome bonus',
              referenceType: 'WELCOME_BONUS',
            },
          });
        }

        // 4. Handle referral connection and bonus
        if (referrer && referrer.id !== createdUser.id) {
          await tx.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: createdUser.id,
              rewardGiven: true,
            },
          });

          // Reward the referrer
          const referrerWallet = await tx.wallet.upsert({
            where: { userId: referrer.id },
            update: {
              balance: {
                increment: config.REFERRAL_BONUS_COINS,
              },
            },
            create: {
              userId: referrer.id,
              balance: config.REFERRAL_BONUS_COINS,
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: referrerWallet.id,
              type: WalletTransactionType.REFERRAL_BONUS,
              amount: config.REFERRAL_BONUS_COINS,
              balanceAfter: referrerWallet.balance,
              description: `Referral reward for inviting ${displayName}`,
              referenceId: createdUser.id,
              referenceType: 'REFERRAL',
            },
          });
        }

        return createdUser;
      });

      logger.info(
        { userId: newUser.id, telegramId: strTelegramId, referrerId: referrer?.id },
        'Registered new user from Telegram',
      );

      return {
        user: newUser,
        isNewUser: true,
        referrer: referrer && referrer.id !== newUser.id ? referrer : null,
        referralRewardAmount: config.REFERRAL_BONUS_COINS,
      };
    } catch (error) {
      logger.warn({ err: (error as any)?.message, userId: tgUser.id }, 'Database offline, using fallback user profile');
      const fallbackUser: DbUserWithTelegram = {
        id: `local_${tgUser.id}`,
        username: tgUser.username || null,
        displayName,
        avatarUrl: tgUser.photo_url || null,
        language: userLang,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        rating: 1200,
        createdAt: new Date(),
        updatedAt: new Date(),
        telegramAccount: {
          id: `local_tg_${tgUser.id}`,
          telegramId: strTelegramId,
          userId: `local_${tgUser.id}`,
          username: tgUser.username || null,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name || null,
          photoUrl: tgUser.photo_url || null,
          languageCode: tgUser.language_code || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      return {
        user: fallbackUser,
        isNewUser: false,
        referrer: null,
        referralRewardAmount: 0,
      };
    }
  }

  /**
   * Retrieve user by Telegram ID
   */
  static async getUserByTelegramId(telegramId: string): Promise<DbUserWithTelegram | null> {
    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId: String(telegramId) },
      include: {
        user: {
          include: {
            telegramAccount: true,
          },
        },
      },
    });

    return account?.user ?? null;
  }

  /**
   * Retrieve user by DB ID
   */
  static async getUserById(userId: string): Promise<DbUserWithTelegram | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: true,
      },
    });
  }

  /**
   * Update user interface language
   */
  static async updateLanguage(userId: string, language: SupportedLanguage): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { language },
    });
  }

  /**
   * Get user gameplay statistics and referral link
   */
  static async getUserStats(userId: string): Promise<UserStatsResult> {
    const config = getBotConfig();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: true,
        wallet: true,
        _count: {
          select: {
            referralsGiven: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Count games
    const [totalGames, wins, draws] = await Promise.all([
      prisma.game.count({
        where: {
          status: 'FINISHED',
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
      }),
      prisma.game.count({
        where: {
          status: 'FINISHED',
          winnerId: userId,
        },
      }),
      prisma.game.count({
        where: {
          status: 'FINISHED',
          result: 'DRAW',
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
      }),
    ]);

    const losses = Math.max(0, totalGames - wins - draws);
    const winrate = totalGames > 0 ? Number(((wins / totalGames) * 100).toFixed(1)) : 0;
    const balance = user.wallet?.balance ?? 0;
    const referralsCount = user._count.referralsGiven;

    const refParam = user.telegramAccount?.telegramId || user.id;
    const referralLink = `https://t.me/${config.TELEGRAM_BOT_USERNAME}?start=ref_${refParam}`;

    return {
      userId: user.id,
      displayName: user.displayName,
      username: user.username,
      rating: Math.round(user.rating),
      totalGames,
      wins,
      draws,
      losses,
      winrate,
      balance,
      referralsCount,
      referralLink,
    };
  }

  /**
   * Fetch all active users with registered Telegram accounts for admin broadcasts
   */
  static async getAllTelegramUsers(): Promise<Array<{ telegramId: string; language: string }>> {
    const accounts = await prisma.telegramAccount.findMany({
      where: {
        user: {
          isBanned: false,
        },
      },
      select: {
        telegramId: true,
        user: {
          select: {
            language: true,
          },
        },
      },
    });

    return accounts.map((acc) => ({
      telegramId: acc.telegramId,
      language: acc.user.language,
    }));
  }
}
