import { Redis } from 'ioredis';
import prisma from '@shashka/database';
import {
  GameMode,
  GameResult,
  GameStatus,
  PlayerColor,
  ResultReason,
} from '@shashka/shared-types';
import { createInitialBoard } from '@shashka/game-engine';
import { GameService } from './game.service.js';
import { getConfig } from '../config.js';

export interface QueueEntry {
  userId: string;
  rating: number;
  mode: GameMode;
  rated: boolean;
  timeControl: {
    initialSeconds: number;
    incrementSeconds: number;
  };
  joinedAt: number;
}

export class MatchmakingService {
  private static redisClient: Redis | null = null;
  private static localQueue: Map<string, QueueEntry> = new Map();
  private static disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  public static getRedis(): Redis | null {
    if (!this.redisClient) {
      try {
        const config = getConfig();
        if (config.REDIS_URL) {
          this.redisClient = new Redis(config.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null, // Don't hang if local redis is not running
          });
          this.redisClient.on('error', () => {
            // Handled gracefully, fallback to memory
          });
        }
      } catch {
        this.redisClient = null;
      }
    }
    return this.redisClient;
  }

  /**
   * Adds a player to the matchmaking queue.
   */
  public static async joinQueue(
    userId: string,
    mode: GameMode = GameMode.CLASSIC,
    rated = true,
    timeControl = { initialSeconds: 180, incrementSeconds: 2 },
  ): Promise<{ position: number; match?: any }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, rating: true, isBanned: true },
    });

    if (!user || user.isBanned) {
      throw new Error('User cannot join matchmaking');
    }

    const entry: QueueEntry = {
      userId,
      rating: user.rating,
      mode,
      rated,
      timeControl,
      joinedAt: Date.now(),
    };

    const redis = this.getRedis();
    if (redis && redis.status === 'ready') {
      await redis.hset(`matchmaking:queue:${mode}`, userId, JSON.stringify(entry));
    } else {
      this.localQueue.set(`${mode}:${userId}`, entry);
    }

    // Attempt to match immediately
    const match = await this.findMatch(mode);
    if (match) {
      return { position: 1, match };
    }

    return {
      position: await this.getQueueSize(mode),
    };
  }

  /**
   * Removes a player from the matchmaking queue.
   */
  public static async leaveQueue(userId: string, mode: GameMode = GameMode.CLASSIC): Promise<void> {
    const redis = this.getRedis();
    if (redis && redis.status === 'ready') {
      await redis.hdel(`matchmaking:queue:${mode}`, userId);
    } else {
      this.localQueue.delete(`${mode}:${userId}`);
    }
  }

  /**
   * Returns current count of queued players for a given mode.
   */
  public static async getQueueSize(mode: GameMode): Promise<number> {
    const redis = this.getRedis();
    if (redis && redis.status === 'ready') {
      return redis.hlen(`matchmaking:queue:${mode}`);
    }

    let count = 0;
    for (const [key] of this.localQueue) {
      if (key.startsWith(`${mode}:`)) count++;
    }
    return count;
  }

  /**
   * Finds matching players based on rating proximity and wait time.
   */
  public static async findMatch(mode: GameMode) {
    let entries: QueueEntry[] = [];
    const redis = this.getRedis();

    if (redis && redis.status === 'ready') {
      const rawMap = await redis.hgetall(`matchmaking:queue:${mode}`);
      entries = Object.values(rawMap).map((json) => JSON.parse(json) as QueueEntry);
    } else {
      for (const [key, val] of this.localQueue) {
        if (key.startsWith(`${mode}:`)) {
          entries.push(val);
        }
      }
    }

    if (entries.length < 2) {
      return null;
    }

    // Sort by longest wait time first
    entries.sort((a, b) => a.joinedAt - b.joinedAt);

    const now = Date.now();

    for (let i = 0; i < entries.length; i++) {
      const p1 = entries[i]!;
      const waitSeconds1 = (now - p1.joinedAt) / 1000;
      // Allow rating difference window to expand by 50 points per 5 seconds of waiting
      const allowedGap1 = 150 + waitSeconds1 * 10;

      for (let j = i + 1; j < entries.length; j++) {
        const p2 = entries[j]!;
        const ratingDiff = Math.abs(p1.rating - p2.rating);

        if (ratingDiff <= allowedGap1 && p1.rated === p2.rated) {
          // Match found! Remove both from queue
          await this.leaveQueue(p1.userId, mode);
          await this.leaveQueue(p2.userId, mode);

          const game = await this.createOnlineGame(
            p1.userId,
            p2.userId,
            mode,
            p1.timeControl,
            p1.rated,
          );

          return {
            game,
            player1Id: p1.userId,
            player2Id: p2.userId,
          };
        }
      }
    }

    return null;
  }

  /**
   * Creates an active online multiplayer game between two matched players.
   */
  public static async createOnlineGame(
    player1Id: string,
    player2Id: string,
    mode: GameMode = GameMode.CLASSIC,
    timeControl = { initialSeconds: 180, incrementSeconds: 2 },
    rated = true,
  ) {
    // Random color assignment
    const assignWhiteToP1 = Math.random() < 0.5;
    const whitePlayerId = assignWhiteToP1 ? player1Id : player2Id;
    const blackPlayerId = assignWhiteToP1 ? player2Id : player1Id;

    const initialBoard = createInitialBoard();

    const game = await prisma.game.create({
      data: {
        mode,
        status: GameStatus.IN_PROGRESS,
        whitePlayerId,
        blackPlayerId,
        currentTurn: PlayerColor.WHITE,
        boardState: GameService.serializeBoard(initialBoard) as any,
        isRated: rated,
        config: {
          timeControl,
          isGiveaway: mode === GameMode.GIVEAWAY,
          rated,
        },
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    return game;
  }

  /**
   * Handles player disconnection with grace period timer.
   */
  public static handleDisconnect(
    userId: string,
    gameId: string,
    gracePeriodSeconds = 30,
    onAbandonment?: (abandonedUserId: string, gameId: string) => void,
  ) {
    const timerKey = `${gameId}:${userId}`;

    // Clear existing timer if any
    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
    }

    const timer = setTimeout(async () => {
      this.disconnectTimers.delete(timerKey);
      try {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (game && game.status === GameStatus.IN_PROGRESS) {
          const winnerId =
            game.whitePlayerId === userId ? game.blackPlayerId : game.whitePlayerId;
          const result =
            game.whitePlayerId === userId ? GameResult.BLACK_WON : GameResult.WHITE_WON;

          await GameService.finishGame(
            gameId,
            result,
            ResultReason.DISCONNECTION,
            winnerId,
          );

          if (onAbandonment) {
            onAbandonment(userId, gameId);
          }
        }
      } catch (err) {
        console.error('Error handling player abandonment:', err);
      }
    }, gracePeriodSeconds * 1000);

    this.disconnectTimers.set(timerKey, timer);
  }

  /**
   * Handles player reconnection, cancelling grace period timer.
   */
  public static handleReconnect(userId: string, gameId: string): boolean {
    const timerKey = `${gameId}:${userId}`;
    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
      this.disconnectTimers.delete(timerKey);
      return true;
    }
    return false;
  }
}

export default MatchmakingService;
