import prisma from '@shashka/database';
import { activeOnlineUsers } from '../plugins/socket.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export class FriendService {
  /**
   * Adds a friend (creates mutual accepted friendship).
   */
  public static async addFriend(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestError('O\'zingizni do\'st sifatida qo\'sha olmaysiz');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('Foydalanuvchi topilmadi');
    }

    // Upsert friendship from user -> target
    await prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId,
          friendId: targetUserId,
        },
      },
      update: {
        status: 'ACCEPTED',
      },
      create: {
        userId,
        friendId: targetUserId,
        status: 'ACCEPTED',
      },
    });

    // Upsert reciprocal friendship target -> user
    await prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId: targetUserId,
          friendId: userId,
        },
      },
      update: {
        status: 'ACCEPTED',
      },
      create: {
        userId: targetUserId,
        friendId: userId,
        status: 'ACCEPTED',
      },
    });

    return {
      id: targetUser.id,
      displayName: targetUser.displayName,
      username: targetUser.username,
      avatarUrl: targetUser.avatarUrl,
      rating: targetUser.rating,
      isOnline: activeOnlineUsers.has(targetUser.id),
      isFriend: true,
    };
  }

  /**
   * Returns all accepted friends of the user.
   */
  public static async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        userId,
        status: 'ACCEPTED',
      },
      include: {
        friend: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return friendships.map((f) => ({
      id: f.friend.id,
      displayName: f.friend.displayName,
      username: f.friend.username,
      avatarUrl: f.friend.avatarUrl,
      rating: f.friend.rating,
      isOnline: activeOnlineUsers.has(f.friend.id),
      friendshipId: f.id,
      createdAt: f.createdAt,
    }));
  }

  /**
   * Checks if target is already a friend.
   */
  public static async checkIsFriend(userId: string, targetUserId: string): Promise<boolean> {
    if (!userId || !targetUserId) return false;
    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId: targetUserId,
        },
      },
    });
    return friendship?.status === 'ACCEPTED';
  }

  /**
   * Removes a friend.
   */
  public static async removeFriend(userId: string, targetUserId: string) {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    return { success: true };
  }
}
