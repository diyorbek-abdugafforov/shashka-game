import { create } from 'zustand';
import {
  PlayerColor,
  PieceType,
  GameMode,
  GameStatus,
  GameResult,
  ResultReason,
  type BoardCoordinate,
  type BoardMatrix,
  type GameStatePayload,
  type GameMoveAcceptedPayload,
} from '@shashka/shared-types';
import {
  createInitialBoard,
  cloneBoard,
  getLegalMoves,
  getBestMove,
  deserializeBoard,
  type Move as ValidatedMove,
  Player,
  type GameState as EngineGameState,
  GameStatus as EngineGameStatus,
} from '@shashka/game-engine';
import { triggerHaptic } from '../utils/telegram';
import {
  playMoveSound,
  playCaptureSound,
  playPromotionSound,
  playWinSound,
  playLoseSound,
} from '../utils/sound';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface PlayerDisplay {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  isOnline: boolean;
}

interface GameState {
  // Common game state
  mode: GameMode;
  board: BoardMatrix;
  currentTurn: PlayerColor;
  selectedCoordinate: BoardCoordinate | null;
  legalMoves: ValidatedMove[];
  lastMove: { from: BoardCoordinate; to: BoardCoordinate } | null;
  moveHistory: ValidatedMove[];
  isGameOver: boolean;
  gameResult: GameResult | null;
  resultReason: ResultReason | null;
  isSubmittingMove: boolean;

  // Offline / Pass & Play / Bot state
  botDifficulty: BotDifficulty;
  isBotThinking: boolean;
  offlineScores: { white: number; black: number; draws: number };

  // Online game state
  onlineGameId: string | null;
  myColor: PlayerColor | null;
  whitePlayer: PlayerDisplay | null;
  blackPlayer: PlayerDisplay | null;
  whiteTimeLeftMs: number;
  blackTimeLeftMs: number;
  drawOfferedBy: PlayerColor | null;
  isOpponentDisconnected: boolean;

  // Actions
  initNewOfflineGame: (mode?: GameMode) => void;
  initNewBotGame: (difficulty: BotDifficulty) => void;
  selectSquare: (coord: BoardCoordinate | null) => void;
  executeMove: (move: ValidatedMove) => boolean;
  triggerBotMove: () => void;
  resignGame: (resigningColor: PlayerColor) => void;
  offerDrawOffline: () => void;
  resetScores: () => void;

  // Online actions
  setOnlineGameState: (payload: GameStatePayload, myUserId?: string) => void;
  applyOnlineMove: (payload: GameMoveAcceptedPayload) => void;
  setDrawOffer: (color: PlayerColor | null) => void;
  setOpponentDisconnection: (isDisconnected: boolean) => void;
  setOnlineGameFinished: (result: GameResult, reason: ResultReason) => void;
  updateTimer: (whiteMs: number, blackMs: number) => void;
  tickTimer: () => void;
  clearOnlineGame: () => void;
}

// Bot AI Evaluation Function
function evaluateBoard(board: BoardMatrix, color: PlayerColor): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (!piece) continue;

      const isMe = piece.color === color;
      const pieceVal = piece.type === PieceType.KING ? 4.5 : 1.0;
      // Positional advantage: central squares & advanced pieces
      const centerBonus = (r >= 2 && r <= 5 && c >= 2 && c <= 5) ? 0.2 : 0;
      const rankBonus = piece.type === PieceType.MAN
        ? (piece.color === PlayerColor.WHITE ? (7 - r) * 0.1 : r * 0.1)
        : 0;

      const totalVal = pieceVal + centerBonus + rankBonus;
      score += isMe ? totalVal : -totalVal;
    }
  }
  return score;
}

function findBestMove(
  board: BoardMatrix,
  color: PlayerColor,
  depth: number,
  _alpha: number,
  _beta: number,
  _isMaximizing: boolean,
): { score: number; move?: ValidatedMove } {
  const enginePlayer = color === PlayerColor.WHITE ? Player.WHITE : Player.BLACK;
  const state: EngineGameState = {
    board: board as any,
    currentPlayer: enginePlayer,
    moveHistory: [],
    status: EngineGameStatus.PLAYING,
    moveCount: 0,
    config: { maxRepetitions: 3 },
    halfMoveClock: 0,
    positionHistory: [],
  };
  const diff = depth <= 2 ? 'EASY' : depth === 3 ? 'MEDIUM' : 'HARD';
  const move = getBestMove(state, diff);
  return { score: 0, move: move || undefined };
}

function applyMoveToBoard(board: BoardMatrix, move: ValidatedMove, turn: PlayerColor): BoardMatrix {
  const newBoard = cloneBoard(board as any) as any;
  const movingPiece = newBoard[move.from.row]?.[move.from.col];

  if (!movingPiece) return newBoard;

  newBoard[move.from.row]![move.from.col] = null;

  // Remove captured pieces
  if (move.captures) {
    for (const cap of move.captures) {
      newBoard[cap.row]![cap.col] = null;
    }
  }

  const isKing = movingPiece.type === PieceType.KING || move.promotion;
  newBoard[move.to.row]![move.to.col] = {
    player: turn,
    color: turn,
    type: isKing ? PieceType.KING : PieceType.MAN,
    position: { row: move.to.row, col: move.to.col },
  };

  return newBoard;
}

function normalizeBoard(rawBoard: any): BoardMatrix {
  if (!Array.isArray(rawBoard)) return normalizeBoard(createInitialBoard());
  return rawBoard.map((row: any[]) =>
    Array.isArray(row)
      ? row.map((piece: any) => {
          if (!piece) return null;
          const color =
            piece.color === PlayerColor.WHITE ||
            piece.player === Player.WHITE ||
            piece.color === 'WHITE' ||
            piece.player === 'WHITE'
              ? PlayerColor.WHITE
              : PlayerColor.BLACK;
          const type = piece.type === PieceType.KING ? PieceType.KING : PieceType.MAN;
          return {
            ...piece,
            color,
            player: color,
            type,
          };
        })
      : [],
  );
}

export function extractBoardMatrix(raw: any): BoardMatrix {
  if (!raw) return normalizeBoard(createInitialBoard());
  if (Array.isArray(raw) && raw.length === 8 && Array.isArray(raw[0])) {
    return normalizeBoard(raw);
  }
  if (raw && typeof raw === 'object' && Array.isArray(raw.matrix) && raw.matrix.length === 8) {
    return normalizeBoard(raw.matrix);
  }
  if (typeof raw === 'string') {
    try {
      return normalizeBoard(deserializeBoard(raw));
    } catch {
      return normalizeBoard(createInitialBoard());
    }
  }
  return normalizeBoard(createInitialBoard());
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: GameMode.CLASSIC,
  board: normalizeBoard(createInitialBoard()),
  currentTurn: PlayerColor.WHITE,
  selectedCoordinate: null,
  legalMoves: getLegalMoves(createInitialBoard(), Player.WHITE),
  lastMove: null,
  moveHistory: [],
  isGameOver: false,
  gameResult: null,
  resultReason: null,
  isSubmittingMove: false,

  botDifficulty: 'medium',
  isBotThinking: false,
  offlineScores: { white: 0, black: 0, draws: 0 },

  onlineGameId: null,
  myColor: null,
  whitePlayer: null,
  blackPlayer: null,
  whiteTimeLeftMs: 180000,
  blackTimeLeftMs: 180000,
  drawOfferedBy: null,
  isOpponentDisconnected: false,

  initNewOfflineGame: (mode = GameMode.CLASSIC) => {
    const initialBoard = createInitialBoard();
    const legal = getLegalMoves(initialBoard, Player.WHITE);
    set({
      mode,
      board: normalizeBoard(initialBoard),
      currentTurn: PlayerColor.WHITE,
      selectedCoordinate: null,
      legalMoves: legal,
      lastMove: null,
      moveHistory: [],
      isGameOver: false,
      gameResult: null,
      resultReason: null,
      isSubmittingMove: false,
      whiteTimeLeftMs: 180000,
      blackTimeLeftMs: 180000,
    });
  },

  initNewBotGame: (difficulty: BotDifficulty) => {
    const initialBoard = createInitialBoard();
    const legal = getLegalMoves(initialBoard, Player.WHITE);
    set({
      mode: GameMode.BOT,
      botDifficulty: difficulty,
      board: normalizeBoard(initialBoard),
      currentTurn: PlayerColor.WHITE,
      selectedCoordinate: null,
      legalMoves: legal,
      lastMove: null,
      moveHistory: [],
      isGameOver: false,
      gameResult: null,
      resultReason: null,
      isBotThinking: false,
      isSubmittingMove: false,
      whiteTimeLeftMs: 180000,
      blackTimeLeftMs: 180000,
    });
  },

  selectSquare: (coord: BoardCoordinate | null) => {
    const { isGameOver, isSubmittingMove, isBotThinking } = get();
    if (isGameOver || isSubmittingMove || isBotThinking) return;

    if (!coord) {
      set({ selectedCoordinate: null });
      return;
    }

    const { board, currentTurn } = get();
    const piece = board[coord.row]?.[coord.col];
    const pieceColor = piece ? (piece.color || (piece as any).player) : null;

    // If clicking a piece of current player's turn, select it
    if (piece && pieceColor === currentTurn) {
      triggerHaptic('selection');
      set({ selectedCoordinate: coord });
    } else {
      // Deselect if clicking an invalid square
      set({ selectedCoordinate: null });
    }
  },

  executeMove: (move: ValidatedMove) => {
    const { board, currentTurn, moveHistory, mode, offlineScores } = get();

    // Prevent double clicking / moving when game over
    if (get().isGameOver || get().isSubmittingMove) return false;

    set({ isSubmittingMove: true });
    triggerHaptic(move.captures && move.captures.length > 0 ? 'heavy' : 'light');

    // Play appropriate sound
    if (move.captures && move.captures.length > 0) {
      playCaptureSound();
    } else if (move.promotion) {
      playPromotionSound();
    } else {
      playMoveSound();
    }

    const nextBoard = applyMoveToBoard(board, move, currentTurn);
    const nextTurn = currentTurn === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    const nextLegalMoves = getLegalMoves(nextBoard as any, nextTurn === PlayerColor.WHITE ? Player.WHITE : Player.BLACK);

    let isOver = false;
    let result: GameResult | null = null;
    let reason: ResultReason | null = null;

    if (nextLegalMoves.length === 0) {
      isOver = true;
      // In giveaway (poddavki), player with no moves or no pieces WINS!
      if (mode === GameMode.GIVEAWAY) {
        result = nextTurn === PlayerColor.WHITE ? GameResult.WHITE_WON : GameResult.BLACK_WON;
        reason = ResultReason.NO_LEGAL_MOVES;
      } else {
        result = nextTurn === PlayerColor.WHITE ? GameResult.BLACK_WON : GameResult.WHITE_WON;
        reason = ResultReason.NO_LEGAL_MOVES;
      }

      // Update scores
      const newScores = { ...offlineScores };
      if (result === GameResult.WHITE_WON) newScores.white++;
      else if (result === GameResult.BLACK_WON) newScores.black++;
      set({ offlineScores: newScores });

      // Play victory / defeat sounds
      if (mode === GameMode.BOT) {
        if (result === GameResult.WHITE_WON) {
          playWinSound();
        } else {
          playLoseSound();
        }
      } else {
        playWinSound();
      }
    }

    set({
      board: nextBoard,
      currentTurn: nextTurn,
      selectedCoordinate: null,
      legalMoves: nextLegalMoves,
      lastMove: { from: move.from, to: move.to },
      moveHistory: [...moveHistory, move],
      isGameOver: isOver,
      gameResult: result,
      resultReason: reason,
      isSubmittingMove: false,
    });

    // If bot game and it's black's turn and not game over, trigger bot move
    if (mode === GameMode.BOT && nextTurn === PlayerColor.BLACK && !isOver) {
      setTimeout(() => {
        get().triggerBotMove();
      }, 80);
    }

    return true;
  },

  triggerBotMove: () => {
    const { board, currentTurn, legalMoves, botDifficulty, isGameOver } = get();
    if (isGameOver || currentTurn !== PlayerColor.BLACK || legalMoves.length === 0) return;

    set({ isBotThinking: true });

    setTimeout(() => {
      let chosenMove: ValidatedMove;

      if (botDifficulty === 'easy') {
        // Random move among legal moves
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        chosenMove = legalMoves[randomIndex]!;
      } else if (botDifficulty === 'medium') {
        // 2-ply search
        const result = findBestMove(board, PlayerColor.BLACK, 2, -Infinity, Infinity, true);
        chosenMove = result.move || legalMoves[0]!;
      } else {
        // Hard: 3-ply search with alpha-beta
        const result = findBestMove(board, PlayerColor.BLACK, 3, -Infinity, Infinity, true);
        chosenMove = result.move || legalMoves[0]!;
      }

      set({ isBotThinking: false });
      get().executeMove(chosenMove);
    }, 120);
  },

  resignGame: (resigningColor: PlayerColor) => {
    const { offlineScores, mode } = get();
    const result = resigningColor === PlayerColor.WHITE ? GameResult.BLACK_WON : GameResult.WHITE_WON;
    const newScores = { ...offlineScores };
    if (result === GameResult.WHITE_WON) newScores.white++;
    else newScores.black++;

    triggerHaptic('error');
    playLoseSound();
    set({
      isGameOver: true,
      gameResult: result,
      resultReason: ResultReason.RESIGNATION,
      offlineScores: newScores,
    });
  },

  offerDrawOffline: () => {
    const { offlineScores } = get();
    triggerHaptic('warning');
    playMoveSound();
    set({
      isGameOver: true,
      gameResult: GameResult.DRAW,
      resultReason: ResultReason.DRAW_AGREEMENT,
      offlineScores: {
        ...offlineScores,
        draws: offlineScores.draws + 1,
      },
    });
  },

  resetScores: () => {
    set({ offlineScores: { white: 0, black: 0, draws: 0 } });
  },

  // Online game actions
  setOnlineGameState: (payload: GameStatePayload, myUserId?: string) => {
    const myColor = myUserId
      ? payload.whitePlayer.id === myUserId
        ? PlayerColor.WHITE
        : payload.blackPlayer.id === myUserId
          ? PlayerColor.BLACK
          : null
      : null;

    const board = extractBoardMatrix(payload.game.boardState);
    const currentTurn = payload.game.currentTurn || PlayerColor.WHITE;
    const legalMoves = getLegalMoves(board as any, currentTurn === PlayerColor.WHITE ? Player.WHITE : Player.BLACK);

    if (payload.game.status === GameStatus.FINISHED && myColor) {
      const iWon = (myColor === PlayerColor.WHITE && payload.game.result === GameResult.WHITE_WON) ||
                   (myColor === PlayerColor.BLACK && payload.game.result === GameResult.BLACK_WON);
      if (iWon) playWinSound();
      else if (payload.game.result !== GameResult.DRAW) playLoseSound();
    }

    set({
      onlineGameId: payload.game.id,
      mode: payload.game.mode,
      board,
      currentTurn,
      legalMoves,
      selectedCoordinate: null,
      myColor,
      whitePlayer: payload.whitePlayer,
      blackPlayer: payload.blackPlayer,
      whiteTimeLeftMs: payload.game.whiteTimeLeftMs,
      blackTimeLeftMs: payload.game.blackTimeLeftMs,
      isGameOver: payload.game.status === GameStatus.FINISHED,
      gameResult: payload.game.result,
      resultReason: payload.game.resultReason,
      moveHistory: payload.moves.map((m) => ({
        from: m.from,
        to: m.to,
        captures: m.captures,
        promotion: m.isPromotion,
        notation: m.notation,
      })) as any,
      lastMove: payload.moves.length > 0 ? {
        from: payload.moves[payload.moves.length - 1]!.from,
        to: payload.moves[payload.moves.length - 1]!.to,
      } : null,
      isSubmittingMove: false,
    });
  },

  applyOnlineMove: (payload: GameMoveAcceptedPayload) => {
    const { board, moveHistory } = get();
    const move = payload.move;
    const validatedMove: ValidatedMove = {
      from: move.from,
      to: move.to,
      captures: move.captures,
      promotion: move.isPromotion,
    };
    (validatedMove as any).notation = move.notation;

    const nextBoard = applyMoveToBoard(board, validatedMove, move.player);
    const nextLegalMoves = getLegalMoves(nextBoard as any, payload.nextTurn === PlayerColor.WHITE ? Player.WHITE : Player.BLACK);

    triggerHaptic(move.captures.length > 0 ? 'heavy' : 'light');

    if (move.captures && move.captures.length > 0) {
      playCaptureSound();
    } else if (move.isPromotion) {
      playPromotionSound();
    } else {
      playMoveSound();
    }

    set({
      board: nextBoard,
      currentTurn: payload.nextTurn,
      selectedCoordinate: null,
      legalMoves: nextLegalMoves,
      lastMove: { from: move.from, to: move.to },
      moveHistory: [...moveHistory, validatedMove],
      whiteTimeLeftMs: payload.whiteTimeLeftMs,
      blackTimeLeftMs: payload.blackTimeLeftMs,
      isSubmittingMove: false,
    });
  },

  setDrawOffer: (color: PlayerColor | null) => {
    set({ drawOfferedBy: color });
    if (color) {
      triggerHaptic('warning');
    }
  },

  setOpponentDisconnection: (isDisconnected: boolean) => {
    set({ isOpponentDisconnected: isDisconnected });
  },

  setOnlineGameFinished: (result: GameResult, reason: ResultReason) => {
    triggerHaptic(result === GameResult.DRAW ? 'warning' : 'success');
    set({
      isGameOver: true,
      gameResult: result,
      resultReason: reason,
      isSubmittingMove: false,
    });
  },

  updateTimer: (whiteMs: number, blackMs: number) => {
    set({ whiteTimeLeftMs: whiteMs, blackTimeLeftMs: blackMs });
  },

  tickTimer: () => {
    const { isGameOver, currentTurn, whiteTimeLeftMs, blackTimeLeftMs, offlineScores } = get();
    if (isGameOver) return;

    if (currentTurn === PlayerColor.WHITE) {
      const nextTime = Math.max(0, whiteTimeLeftMs - 1000);
      if (nextTime === 0) {
        triggerHaptic('error');
        const newScores = { ...offlineScores, black: offlineScores.black + 1 };
        set({
          whiteTimeLeftMs: 0,
          isGameOver: true,
          gameResult: GameResult.BLACK_WON,
          resultReason: ResultReason.TIMEOUT,
          offlineScores: newScores,
        });
      } else {
        set({ whiteTimeLeftMs: nextTime });
      }
    } else {
      const nextTime = Math.max(0, blackTimeLeftMs - 1000);
      if (nextTime === 0) {
        triggerHaptic('error');
        const newScores = { ...offlineScores, white: offlineScores.white + 1 };
        set({
          blackTimeLeftMs: 0,
          isGameOver: true,
          gameResult: GameResult.WHITE_WON,
          resultReason: ResultReason.TIMEOUT,
          offlineScores: newScores,
        });
      } else {
        set({ blackTimeLeftMs: nextTime });
      }
    }
  },

  clearOnlineGame: () => {
    set({
      onlineGameId: null,
      myColor: null,
      whitePlayer: null,
      blackPlayer: null,
      drawOfferedBy: null,
      isOpponentDisconnected: false,
      lastMove: null,
    });
  },
}));
