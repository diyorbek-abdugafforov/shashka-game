import prisma from '@shashka/database';
import { GameResult } from '@shashka/shared-types';
import Glicko2, { type GlickoPlayer } from '../utils/glicko2.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const INITIAL_RATING = 1500;
export const INITIAL_RD = 350;
export const INITIAL_VOLATILITY = 0.06;

export interface RatingUpdateResult {
  userId: string;
  oldRating: number;
  newRating: number;
  change: number;
  rd: number;
  volatility: number;
}

export class RatingService {
  /**
   * Retrieves the current Glicko parameters for a user.
   */
  public static async getPlayerGlickoState(userId: string): Promise<GlickoPlayer> {
    const [user, latestHistory] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { rating: true },
      }),
      prisma.ratingHistory.findFirst({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    return {
      rating: user.rating || INITIAL_RATING,
      rd: latestHistory?.ratingDeviation ?? INITIAL_RD,
      vol: latestHistory?.volatility ?? INITIAL_VOLATILITY,
    };
  }

  /**
   * Calculates new ratings between two players based on outcome.
   * Result: WHITE_WON, BLACK_WON, or DRAW.
   */
  public static calculateNewRatings(
    whiteState: GlickoPlayer,
    blackState: GlickoPlayer,
    result: GameResult,
  ) {
    let scoreWhite = 0.5;
    if (result === GameResult.WHITE_WON) {
      scoreWhite = 1;
    } else if (result === GameResult.BLACK_WON) {
      scoreWhite = 0;
    }

    return Glicko2.calculateMatch({
      player1: whiteState,
      player2: blackState,
      score1: scoreWhite,
    });
  }

  /**
   * Updates ratings for both players after a rated game concludes.
   * Executes inside an atomic database transaction.
   */
  public static async updateRatings(gameId: string): Promise<RatingUpdateResult[]> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!game) {
      throw new NotFoundError(`Game ${gameId} not found`);
    }

    if (!game.isRated) {
      return [];
    }

    if (!game.whitePlayerId || !game.blackPlayerId) {
      return [];
    }

    if (!game.result) {
      throw new BadRequestError(`Game ${gameId} has no recorded result`);
    }

    // If bot is playing, calculate human player rating change directly
    if (game.whitePlayer?.isBot || game.blackPlayer?.isBot) {
      const humanIsWhite = !game.whitePlayer?.isBot;
      const humanUser = humanIsWhite ? game.whitePlayer! : game.blackPlayer!;

      const humanWon =
        (humanIsWhite && game.result === GameResult.WHITE_WON) ||
        (!humanIsWhite && game.result === GameResult.BLACK_WON);
      const isDraw = game.result === GameResult.DRAW;

      const change = isDraw ? 0 : humanWon ? 15 : -10;
      const newRating = Math.max(100, Math.round(humanUser.rating + change));

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: humanUser.id },
          data: { rating: newRating },
        });

        await tx.ratingHistory.create({
          data: {
            userId: humanUser.id,
            gameId: game.id,
            rating: newRating,
            ratingDeviation: 300,
            volatility: 0.06,
            change,
          },
        });
      });

      return [
        {
          userId: humanUser.id,
          oldRating: humanUser.rating,
          newRating,
          change,
          rd: 300,
          volatility: 0.06,
        },
      ];
    }

    const [whiteState, blackState] = await Promise.all([
      this.getPlayerGlickoState(game.whitePlayerId),
      this.getPlayerGlickoState(game.blackPlayerId),
    ]);

    const matchCalc = this.calculateNewRatings(whiteState, blackState, game.result as unknown as GameResult);

    const whiteResult: RatingUpdateResult = {
      userId: game.whitePlayerId,
      oldRating: whiteState.rating,
      newRating: matchCalc.player1.rating,
      change: matchCalc.player1.change,
      rd: matchCalc.player1.rd,
      volatility: matchCalc.player1.vol,
    };

    const blackResult: RatingUpdateResult = {
      userId: game.blackPlayerId,
      oldRating: blackState.rating,
      newRating: matchCalc.player2.rating,
      change: matchCalc.player2.change,
      rd: matchCalc.player2.rd,
      volatility: matchCalc.player2.vol,
    };

    await prisma.$transaction(async (tx) => {
      // Update White user rating
      await tx.user.update({
        where: { id: whiteResult.userId },
        data: { rating: whiteResult.newRating },
      });

      // Insert White Rating History
      await tx.ratingHistory.create({
        data: {
          userId: whiteResult.userId,
          gameId: game.id,
          rating: whiteResult.newRating,
          ratingDeviation: whiteResult.rd,
          volatility: whiteResult.volatility,
          change: whiteResult.change,
        },
      });

      // Update Black user rating
      await tx.user.update({
        where: { id: blackResult.userId },
        data: { rating: blackResult.newRating },
      });

      // Insert Black Rating History
      await tx.ratingHistory.create({
        data: {
          userId: blackResult.userId,
          gameId: game.id,
          rating: blackResult.newRating,
          ratingDeviation: blackResult.rd,
          volatility: blackResult.volatility,
          change: blackResult.change,
        },
      });
    });

    return [whiteResult, blackResult];
  }

  /**
   * Retrieves rating history for a user.
   */
  public static async getRatingHistory(userId: string, limit = 50) {
    return prisma.ratingHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        game: {
          select: {
            id: true,
            mode: true,
            result: true,
            startedAt: true,
            finishedAt: true,
          },
        },
      },
    });
  }
}

export default RatingService;
