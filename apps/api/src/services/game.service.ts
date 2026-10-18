import prisma from '@shashka/database';
import {
  GameMode,
  GameResult,
  GameStatus,
  PlayerColor,
  ResultReason,
  WalletTransactionType,
  type BoardCoordinate,
} from '@shashka/shared-types';
import {
  createInitialBoard,
  cloneBoard,
  serializeBoard,
  deserializeBoard,
  getLegalMoves,
  getBestMove,
  type Board,
  type Move,
  type GameState,
  Player,
  PieceType,
  GameStatus as EngineGameStatus,
  type AIDifficulty,
} from '@shashka/game-engine';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { RatingService } from './rating.service.js';
import { WalletService } from './wallet.service.js';

export interface GameMoveInput {
  from: BoardCoordinate;
  to: BoardCoordinate;
  sequence?: BoardCoordinate[];
}

export function positionToNotation(pos: { row: number; col: number }): string {
  const colLetter = String.fromCharCode(97 + pos.col); // 'a' - 'h'
  const rowNumber = 8 - pos.row;                       // 8 - 1
  return `${colLetter}${rowNumber}`;
}

export class GameService {
  /**
   * Helper to serialize board state for database storage.
   */
  public static serializeBoard(board: Board) {
    return {
      fen: serializeBoard(board),
      matrix: board,
    };
  }

  /**
   * Helper to deserialize board state from database JSON.
   */
  public static deserializeBoard(boardJson: any): Board {
    if (!boardJson) return createInitialBoard();
    if (typeof boardJson === 'string') return deserializeBoard(boardJson);
    if (boardJson.fen && typeof boardJson.fen === 'string') return deserializeBoard(boardJson.fen);
    if (boardJson.matrix && Array.isArray(boardJson.matrix)) return boardJson.matrix as Board;
    if (Array.isArray(boardJson)) return boardJson as Board;
    return createInitialBoard();
  }

  /**
   * Finds or provisions a system Bot user.
   */
  public static async getOrCreateBotUser(difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM') {
    const botRatings = {
      EASY: 1000,
      MEDIUM: 1400,
      HARD: 1800,
    };
    const username = `bot_${difficulty.toLowerCase()}`;
    const displayName = `Shashka Bot (${difficulty})`;

    let bot = await prisma.user.findUnique({
      where: { username },
    });

    if (!bot) {
      bot = await prisma.user.create({
        data: {
          username,
          displayName,
          isBot: true,
          rating: botRatings[difficulty],
          wallet: { create: { balance: 0 } },
        },
      });
    }

    return bot;
  }

  /**
   * Creates a game against the computer AI.
   */
  public static async createBotGame(
    userId: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
    timeControl = { initialSeconds: 300, incrementSeconds: 2 },
  ) {
    const botUser = await this.getOrCreateBotUser(difficulty);
    const initialBoard = createInitialBoard();

    const game = await prisma.game.create({
      data: {
        mode: GameMode.BOT,
        status: GameStatus.IN_PROGRESS,
        whitePlayerId: userId,
        blackPlayerId: botUser.id,
        currentTurn: PlayerColor.WHITE,
        boardState: this.serializeBoard(initialBoard) as any,
        isRated: false,
        config: {
          difficulty,
          timeControl,
          isGiveaway: false,
          rated: false,
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
   * Creates an offline / pass-and-play game for a local user.
   */
  public static async createOfflineGame(
    userId: string,
    timeControl = { initialSeconds: 600, incrementSeconds: 0 },
  ) {
    const initialBoard = createInitialBoard();

    const game = await prisma.game.create({
      data: {
        mode: GameMode.CLASSIC,
        status: GameStatus.IN_PROGRESS,
        whitePlayerId: userId,
        blackPlayerId: null, // local second player
        currentTurn: PlayerColor.WHITE,
        boardState: this.serializeBoard(initialBoard) as any,
        isRated: false,
        config: {
          isOffline: true,
          timeControl,
          isGiveaway: false,
          rated: false,
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
   * Creates a multiplayer game room for inviting a friend via link.
   */
  public static async createInviteGame(
    userId: string,
    mode: GameMode = GameMode.CLASSIC,
    timeControl = { initialSeconds: 180, incrementSeconds: 2 },
  ) {
    const initialBoard = createInitialBoard();

    const game = await prisma.game.create({
      data: {
        mode,
        status: GameStatus.WAITING_FOR_PLAYERS,
        whitePlayerId: userId,
        blackPlayerId: null,
        currentTurn: PlayerColor.WHITE,
        boardState: this.serializeBoard(initialBoard) as any,
        isRated: false,
        config: {
          isInvite: true,
          timeControl,
          isGiveaway: mode === GameMode.GIVEAWAY,
          rated: false,
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
   * Helper to ensure user exists in DB before creating a game referencing them
   */
  private static async ensureUserExists(userId: string, defaultName = "O'yinchi") {
    try {
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: userId,
            displayName: defaultName,
            username: `player_${userId.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 15)}`,
            rating: 0,
          },
        });
      }
    } catch (err) {
      console.warn(`Could not verify/create user ${userId} for game:`, err);
    }
  }

  /**
   * Creates a direct 1v1 challenge game between two users.
   */
  public static async createDirectChallengeGame(
    whitePlayerId: string,
    blackPlayerId: string,
    mode: GameMode = GameMode.CLASSIC,
    timeControl = { initialSeconds: 180, incrementSeconds: 2 },
  ) {
    const initialBoard = createInitialBoard();

    // Ensure foreign key constraints are always satisfied
    await Promise.all([
      this.ensureUserExists(whitePlayerId, "Oq o'yinchi"),
      this.ensureUserExists(blackPlayerId, "Qora o'yinchi"),
    ]);

    const game = await prisma.game.create({
      data: {
        mode,
        status: GameStatus.IN_PROGRESS,
        whitePlayerId,
        blackPlayerId,
        currentTurn: PlayerColor.WHITE,
        boardState: this.serializeBoard(initialBoard) as any,
        isRated: true,
        config: {
          isDirectChallenge: true,
          timeControl,
          isGiveaway: mode === GameMode.GIVEAWAY,
          rated: true,
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
   * Joins an invite game as the second player (Black).
   */
  public static async joinInviteGame(gameId: string, userId: string) {
    const game = await this.getGame(gameId);

    // If already a participant, return existing game
    if (game.whitePlayerId === userId || game.blackPlayerId === userId) {
      return game;
    }

    // If black player slot is available, join as Black
    if (!game.blackPlayerId) {
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          blackPlayerId: userId,
          status: GameStatus.IN_PROGRESS,
        },
        include: {
          whitePlayer: true,
          blackPlayer: true,
          winner: true,
        },
      });

      return updatedGame;
    }

    return game;
  }

  /**
   * Retrieves game by ID with full player profiles.
   */
  public static async getGame(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
        winner: true,
      },
    });

    if (!game) {
      throw new NotFoundError(`Game ${gameId} not found`);
    }

    return game;
  }

  /**
   * Retrieves moves for a given game in chronological order.
   */
  public static async getGameMoves(gameId: string) {
    await this.getGame(gameId);

    return prisma.move.findMany({
      where: { gameId },
      orderBy: { moveNumber: 'asc' },
    });
  }

  /**
   * Retrieves game history for a specific user with pagination.
   */
  public static async getUserGameHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
    };

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: {
          whitePlayer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              rating: true,
            },
          },
          blackPlayer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              rating: true,
            },
          },
          winner: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.game.count({ where }),
    ]);

    return {
      items: games,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Validates and applies a move using the Russian Checkers rule engine.
   */
  public static async processMove(gameId: string, userId: string, moveInput: GameMoveInput) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestError(`Game is not in progress (status: ${game.status})`);
    }

    const config = (game.config || {}) as any;
    const isOffline = config?.isOffline === true;

    // Determine player color
    let playerColor: PlayerColor;
    if (isOffline) {
      playerColor = game.currentTurn as unknown as PlayerColor;
    } else if (game.whitePlayerId === userId) {
      playerColor = PlayerColor.WHITE;
    } else if (game.blackPlayerId === userId) {
      playerColor = PlayerColor.BLACK;
    } else {
      throw new ForbiddenError('You are not a participant in this game');
    }

    if (game.currentTurn !== playerColor) {
      throw new BadRequestError(`It is not your turn (${game.currentTurn}'s turn)`);
    }

    const currentBoard = this.deserializeBoard(game.boardState);
    const enginePlayer = playerColor === PlayerColor.WHITE ? Player.WHITE : Player.BLACK;

    // Get all legal moves from the pure Russian checkers engine
    const legalMoves = getLegalMoves(currentBoard, enginePlayer);

    if (legalMoves.length === 0) {
      const opponentColor =
        playerColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
      const winnerId = opponentColor === PlayerColor.WHITE ? game.whitePlayerId : game.blackPlayerId;
      const result =
        opponentColor === PlayerColor.WHITE ? GameResult.WHITE_WON : GameResult.BLACK_WON;

      return this.finishGame(game.id, result, ResultReason.NO_LEGAL_MOVES, winnerId);
    }

    // Match moveInput against legal moves
    const matchedMove = legalMoves.find(
      (m: Move) =>
        m.from.row === moveInput.from.row &&
        m.from.col === moveInput.from.col &&
        m.to.row === moveInput.to.row &&
        m.to.col === moveInput.to.col,
    );

    if (!matchedMove) {
      throw new BadRequestError('Illegal move: Move does not adhere to Russian Checkers rules');
    }

    // Apply move onto simulated board
    const nextBoard = cloneBoard(currentBoard);
    const movingPiece = nextBoard[matchedMove.from.row]![matchedMove.from.col]!;
    nextBoard[matchedMove.from.row]![matchedMove.from.col] = null;

    if (matchedMove.captures) {
      for (const cap of matchedMove.captures) {
        nextBoard[cap.row]![cap.col] = null;
      }
    }

    const resultingType =
      matchedMove.promotion || movingPiece.type === PieceType.KING
        ? PieceType.KING
        : PieceType.MAN;

    nextBoard[matchedMove.to.row]![matchedMove.to.col] = {
      player: movingPiece.player,
      type: resultingType,
      position: { row: matchedMove.to.row, col: matchedMove.to.col },
    };

    const nextTurn =
      playerColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    const nextEnginePlayer = nextTurn === PlayerColor.WHITE ? Player.WHITE : Player.BLACK;

    // Check game over conditions for next player
    const nextPlayerLegalMoves = getLegalMoves(nextBoard, nextEnginePlayer);
    const isGameOver = nextPlayerLegalMoves.length === 0;

    const newMoveCount = game.moveCount + 1;
    const notation = `${positionToNotation(matchedMove.from)}${matchedMove.captures && matchedMove.captures.length > 0 ? ':' : '-'}${positionToNotation(matchedMove.to)}`;

    // Save move and updated game state inside transaction
    const { updatedGame, recordedMove } = await prisma.$transaction(async (tx) => {
      const move = await tx.move.create({
        data: {
          gameId: game.id,
          moveNumber: newMoveCount,
          player: playerColor,
          from: matchedMove.from as any,
          to: matchedMove.to as any,
          captures: (matchedMove.captures || []) as any,
          isPromotion: matchedMove.promotion === true,
          notation,
        },
      });

      const updated = await tx.game.update({
        where: { id: game.id },
        data: {
          boardState: this.serializeBoard(nextBoard) as any,
          currentTurn: nextTurn,
          moveCount: newMoveCount,
        },
        include: {
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      return { updatedGame: updated, recordedMove: move };
    });

    if (isGameOver) {
      const winnerId =
        playerColor === PlayerColor.WHITE ? game.whitePlayerId : game.blackPlayerId;
      const result =
        playerColor === PlayerColor.WHITE ? GameResult.WHITE_WON : GameResult.BLACK_WON;

      const finished = await this.finishGame(
        game.id,
        result,
        ResultReason.NO_LEGAL_MOVES,
        winnerId,
      );
      return { game: finished, move: recordedMove, nextTurn };
    }

    // If bot game and next turn is bot, trigger bot move
    if (game.mode === GameMode.BOT && updatedGame.blackPlayer?.isBot && nextTurn === PlayerColor.BLACK) {
      const botMoveResult = await this.processBotMove(game.id);
      return {
        game: botMoveResult.game,
        move: recordedMove,
        botMove: botMoveResult.move,
        nextTurn: botMoveResult.game.currentTurn,
      };
    }

    return { game: updatedGame, move: recordedMove, nextTurn };
  }

  /**
   * Calculates and performs a move on behalf of the Bot player.
   */
  public static async processBotMove(gameId: string) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestError('Game is not in progress');
    }

    const currentBoard = this.deserializeBoard(game.boardState);
    const legalMoves = getLegalMoves(currentBoard, Player.BLACK);

    if (legalMoves.length === 0) {
      const finished = await this.finishGame(
        game.id,
        GameResult.WHITE_WON,
        ResultReason.NO_LEGAL_MOVES,
        game.whitePlayerId,
      );
      return { game: finished, move: null };
    }

    const config = (game.config || {}) as any;
    const difficulty = (config?.difficulty || 'MEDIUM') as AIDifficulty;

    const botState: GameState = {
      board: currentBoard,
      currentPlayer: Player.BLACK,
      moveHistory: [],
      status: EngineGameStatus.PLAYING,
      moveCount: game.moveCount,
      config: { maxRepetitions: 3 },
      halfMoveClock: 0,
      positionHistory: [],
    };

    const chosenMove = getBestMove(botState, difficulty) || legalMoves[0]!;

    const nextBoard = cloneBoard(currentBoard);
    const movingPiece = nextBoard[chosenMove.from.row]![chosenMove.from.col]!;
    nextBoard[chosenMove.from.row]![chosenMove.from.col] = null;

    if (chosenMove.captures) {
      for (const cap of chosenMove.captures) {
        nextBoard[cap.row]![cap.col] = null;
      }
    }

    const resultingType =
      chosenMove.promotion || movingPiece.type === PieceType.KING
        ? PieceType.KING
        : PieceType.MAN;

    nextBoard[chosenMove.to.row]![chosenMove.to.col] = {
      player: movingPiece.player,
      type: resultingType,
      position: { row: chosenMove.to.row, col: chosenMove.to.col },
    };

    const nextPlayerLegalMoves = getLegalMoves(nextBoard, Player.WHITE);
    const isGameOver = nextPlayerLegalMoves.length === 0;

    const newMoveCount = game.moveCount + 1;
    const notation = `${positionToNotation(chosenMove.from)}${chosenMove.captures && chosenMove.captures.length > 0 ? ':' : '-'}${positionToNotation(chosenMove.to)}`;

    const { updatedGame, recordedMove } = await prisma.$transaction(async (tx) => {
      const move = await tx.move.create({
        data: {
          gameId: game.id,
          moveNumber: newMoveCount,
          player: PlayerColor.BLACK,
          from: chosenMove.from as any,
          to: chosenMove.to as any,
          captures: (chosenMove.captures || []) as any,
          isPromotion: chosenMove.promotion === true,
          notation,
        },
      });

      const updated = await tx.game.update({
        where: { id: game.id },
        data: {
          boardState: this.serializeBoard(nextBoard) as any,
          currentTurn: PlayerColor.WHITE,
          moveCount: newMoveCount,
        },
        include: {
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      return { updatedGame: updated, recordedMove: move };
    });

    if (isGameOver) {
      const finished = await this.finishGame(
        game.id,
        GameResult.BLACK_WON,
        ResultReason.NO_LEGAL_MOVES,
        game.blackPlayerId,
      );
      return { game: finished, move: recordedMove };
    }

    return { game: updatedGame, move: recordedMove };
  }

  /**
   * Resign game handler.
   */
  public static async handleResign(gameId: string, userId: string) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestError('Game is not in progress');
    }

    let winnerId: string | null = null;
    let result: GameResult;

    if (game.whitePlayerId === userId) {
      winnerId = game.blackPlayerId;
      result = GameResult.BLACK_WON;
    } else if (game.blackPlayerId === userId) {
      winnerId = game.whitePlayerId;
      result = GameResult.WHITE_WON;
    } else {
      throw new ForbiddenError('You are not a participant in this game');
    }

    return this.finishGame(gameId, result, ResultReason.RESIGNATION, winnerId);
  }

  /**
   * Draw offer handler.
   */
  public static async handleDrawOffer(gameId: string, userId: string) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestError('Game is not in progress');
    }

    const isWhite = game.whitePlayerId === userId;
    const isBlack = game.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new ForbiddenError('You are not a participant in this game');
    }

    const currentConfig = (game.config || {}) as any;
    const drawOfferedBy = isWhite ? PlayerColor.WHITE : PlayerColor.BLACK;

    await prisma.game.update({
      where: { id: gameId },
      data: {
        config: {
          ...currentConfig,
          drawOfferedBy,
        },
      },
    });

    return { gameId, drawOfferedBy };
  }

  /**
   * Draw accept handler.
   */
  public static async handleDrawAccept(gameId: string, userId: string) {
    const game = await this.getGame(gameId);

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestError('Game is not in progress');
    }

    const isWhite = game.whitePlayerId === userId;
    const isBlack = game.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new ForbiddenError('You are not a participant in this game');
    }

    const currentConfig = (game.config || {}) as any;
    const drawOfferedBy = currentConfig.drawOfferedBy as PlayerColor | undefined;

    if (!drawOfferedBy) {
      throw new BadRequestError('No active draw offer for this game');
    }

    const acceptingColor = isWhite ? PlayerColor.WHITE : PlayerColor.BLACK;
    if (drawOfferedBy === acceptingColor) {
      throw new BadRequestError('You cannot accept your own draw offer');
    }

    return this.finishGame(gameId, GameResult.DRAW, ResultReason.DRAW_AGREEMENT, null);
  }

  /**
   * Finalizes game, updates ratings in transaction, and awards tokens.
   */
  public static async finishGame(
    gameId: string,
    result: GameResult,
    reason: ResultReason,
    winnerId: string | null,
  ) {
    const game = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.FINISHED,
        result,
        resultReason: reason,
        winnerId,
        finishedAt: new Date(),
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
        winner: true,
      },
    });

    let ratingUpdates: any[] = [];
    if (game.isRated && game.whitePlayerId && game.blackPlayerId) {
      try {
        ratingUpdates = await RatingService.updateRatings(gameId);
      } catch (err) {
        console.error('Failed to update ratings for game', gameId, err);
      }
    }

    // Award game reward tokens to players
    try {
      if (winnerId) {
        await WalletService.credit(
          winnerId,
          25,
          WalletTransactionType.GAME_REWARD,
          `Reward for winning game ${gameId}`,
          gameId,
          'GAME',
        );
      }
    } catch (err) {
      console.error('Failed to credit game rewards for game', gameId, err);
    }

    return {
      ...game,
      ratingUpdates,
    };
  }

  /**
   * Records a completed game (e.g. vs bot or offline) directly into database with moves and rewards.
   */
  public static async recordCompletedGame(
    userId: string,
    params: {
      mode: GameMode;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      result: GameResult;
      reason: ResultReason;
      moves?: Array<{
        moveNumber?: number;
        player: PlayerColor;
        from: any;
        to: any;
        captures?: any[];
        isPromotion?: boolean;
        notation?: string;
      }>;
    },
  ) {
    const difficulty = params.difficulty || 'MEDIUM';
    const botUser = await this.getOrCreateBotUser(difficulty);
    const initialBoard = createInitialBoard();

    const winnerId =
      params.result === GameResult.WHITE_WON
        ? userId
        : params.result === GameResult.BLACK_WON
          ? botUser.id
          : null;

    const game = await prisma.game.create({
      data: {
        mode: params.mode || GameMode.BOT,
        status: GameStatus.FINISHED,
        whitePlayerId: userId,
        blackPlayerId: botUser.id,
        currentTurn: PlayerColor.WHITE,
        boardState: this.serializeBoard(initialBoard) as any,
        isRated: false,
        result: params.result,
        resultReason: params.reason,
        winnerId,
        moveCount: params.moves ? params.moves.length : 0,
        finishedAt: new Date(),
        config: {
          difficulty,
          isGiveaway: params.mode === GameMode.GIVEAWAY,
        },
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
        winner: true,
      },
    });

    if (params.moves && params.moves.length > 0) {
      await prisma.move.createMany({
        data: params.moves.map((m, idx) => ({
          gameId: game.id,
          moveNumber: m.moveNumber || idx + 1,
          player: m.player,
          from: m.from as any,
          to: m.to as any,
          captures: (m.captures || []) as any,
          isPromotion: m.isPromotion === true,
          notation: m.notation || `${positionToNotation(m.from)}-${positionToNotation(m.to)}`,
        })),
      });
    }

    if (winnerId === userId) {
      try {
        await WalletService.credit(
          userId,
          25,
          WalletTransactionType.GAME_REWARD,
          `G'alaba uchun mukofot (Bot o'yini)`,
          game.id,
          'GAME',
        );
      } catch (err) {
        console.error('Failed to credit bot reward tokens:', err);
      }
    }

    // Update user rating and history
    const userWon = params.result === GameResult.WHITE_WON;
    const isDraw = params.result === GameResult.DRAW;
    const ratingChange = isDraw ? 0 : userWon ? 15 : -10;
    let newRating = 0;

    try {
      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { rating: true },
      });
      if (userRecord) {
        newRating = Math.max(0, Math.round(userRecord.rating + ratingChange));
        await prisma.user.update({
          where: { id: userId },
          data: { rating: newRating },
        });
        await prisma.ratingHistory.create({
          data: {
            userId,
            gameId: game.id,
            rating: newRating,
            ratingDeviation: 300,
            volatility: 0.06,
            change: ratingChange,
          },
        });
      }
    } catch (err) {
      console.error('Failed to update rating in recordCompletedGame:', err);
    }

    return {
      ...game,
      ratingChange,
      newRating,
    };
  }
}

export default GameService;
