import {
  arePositionsEqual,
  cloneBoard,
  createInitialBoard,
  deserializeBoard,
  getPieceAt,
  removePieceAt,
  serializeBoard,
  setPieceAt,
} from './board.js';
import { getLegalMoves, isCaptureAvailable } from './moves.js';
import {
  GameConfig,
  GameResult,
  GameState,
  GameStatus,
  Move,
  MoveHistoryEntry,
  PieceType,
  Player,
} from './types.js';

export const DEFAULT_CONFIG: GameConfig = {
  maxMovesWithoutCapture: 60,
  maxRepetitions: 3,
};

export function createInitialState(config?: Partial<GameConfig>): GameState {
  const finalConfig: GameConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const board = createInitialBoard();
  const initialPosKey = `${serializeBoard(board)}:${Player.WHITE}`;

  return {
    board,
    currentPlayer: Player.WHITE,
    moveHistory: [],
    status: GameStatus.PLAYING,
    moveCount: 0,
    drawOffer: null,
    result: undefined,
    config: finalConfig,
    halfMoveClock: 0,
    positionHistory: [initialPosKey],
  };
}

export function validateMove(
  state: GameState,
  move: Move,
  player?: Player
): { valid: boolean; reason?: string } {
  if (state.status !== GameStatus.PLAYING) {
    return { valid: false, reason: 'Game is not in playing state' };
  }

  const actingPlayer = player ?? state.currentPlayer;
  if (actingPlayer !== state.currentPlayer) {
    return {
      valid: false,
      reason: `Not ${actingPlayer}'s turn; currently ${state.currentPlayer}'s turn`,
    };
  }

  const piece = getPieceAt(state.board, move.from);
  if (!piece) {
    return { valid: false, reason: 'No piece at starting position' };
  }

  if (piece.player !== actingPlayer) {
    return { valid: false, reason: 'Piece does not belong to the acting player' };
  }

  const legalMoves = getLegalMoves(state, actingPlayer);
  const matchingMove = findMatchingLegalMove(legalMoves, move);

  if (!matchingMove) {
    if (isCaptureAvailable(state.board, actingPlayer) && (!move.captures || move.captures.length === 0)) {
      return { valid: false, reason: 'Capture is mandatory' };
    }
    return { valid: false, reason: 'Move is not legal' };
  }

  return { valid: true };
}

function findMatchingLegalMove(legalMoves: Move[], move: Move): Move | undefined {
  return legalMoves.find((legal) => {
    if (!arePositionsEqual(legal.from, move.from) || !arePositionsEqual(legal.to, move.to)) {
      return false;
    }

    // If captures are specified, verify they match
    if (move.captures && move.captures.length > 0) {
      if (!legal.captures || legal.captures.length !== move.captures.length) {
        return false;
      }
      const legalCaps = legal.captures;
      for (let i = 0; i < move.captures.length; i++) {
        const expected = move.captures[i]!;
        const actual = legalCaps[i]!;
        if (!arePositionsEqual(expected, actual)) {
          return false;
        }
      }
    }

    return true;
  });
}

export function applyMove(state: GameState, move: Move): GameState {
  const validation = validateMove(state, move);
  if (!validation.valid) {
    throw new Error(`Invalid move: ${validation.reason}`);
  }

  const legalMoves = getLegalMoves(state, state.currentPlayer);
  const matchedMove = findMatchingLegalMove(legalMoves, move) ?? move;

  const nextBoard = cloneBoard(state.board);
  const movingPiece = getPieceAt(nextBoard, matchedMove.from);
  if (!movingPiece) {
    throw new Error('Internal error: piece not found at source position');
  }

  // Remove piece from origin
  removePieceAt(nextBoard, matchedMove.from);

  // Remove captured pieces
  const hasCaptures = Boolean(matchedMove.captures && matchedMove.captures.length > 0);
  if (matchedMove.captures) {
    for (const capPos of matchedMove.captures) {
      removePieceAt(nextBoard, capPos);
    }
  }

  // Determine promotion
  const reachedPromotionRow =
    (state.currentPlayer === Player.WHITE && matchedMove.to.row === 0) ||
    (state.currentPlayer === Player.BLACK && matchedMove.to.row === 7);
  const newlyPromoted =
    movingPiece.type === PieceType.MAN &&
    (matchedMove.promotion === true || reachedPromotionRow);
  const isKing = movingPiece.type === PieceType.KING || newlyPromoted;

  // Place moving piece at destination
  setPieceAt(nextBoard, matchedMove.to, {
    player: state.currentPlayer,
    type: isKing ? PieceType.KING : PieceType.MAN,
    position: matchedMove.to,
  });

  const nextPlayer = state.currentPlayer === Player.WHITE ? Player.BLACK : Player.WHITE;
  const nextMoveCount = state.moveCount + 1;

  // Half-move clock resets on captures or regular man moves
  const isManMove = movingPiece.type === PieceType.MAN;
  const nextHalfMoveClock = hasCaptures || isManMove ? 0 : state.halfMoveClock + 1;

  const posKey = `${serializeBoard(nextBoard)}:${nextPlayer}`;
  const nextPositionHistory = [...state.positionHistory, posKey];

  const historyEntry: MoveHistoryEntry = {
    ...matchedMove,
    player: state.currentPlayer,
    pieceType: movingPiece.type,
    promotion: newlyPromoted ? true : undefined,
    boardStateAfter: serializeBoard(nextBoard),
  };
  const nextMoveHistory = [...state.moveHistory, historyEntry];

  // Tentative state to evaluate game over conditions
  const tentativeState: GameState = {
    board: nextBoard,
    currentPlayer: nextPlayer,
    moveHistory: nextMoveHistory,
    status: GameStatus.PLAYING,
    moveCount: nextMoveCount,
    drawOffer: null, // Any pending draw offer is cancelled by making a move
    config: state.config,
    halfMoveClock: nextHalfMoveClock,
    positionHistory: nextPositionHistory,
  };

  // 1. Check if next player has any legal moves
  const nextPlayerLegalMoves = getLegalMoves(tentativeState, nextPlayer);
  if (nextPlayerLegalMoves.length === 0) {
    const winner = state.currentPlayer;
    const status = winner === Player.WHITE ? GameStatus.WHITE_WINS : GameStatus.BLACK_WINS;
    const loserName = nextPlayer === Player.WHITE ? 'White' : 'Black';
    return {
      ...tentativeState,
      status,
      result: {
        status,
        reason: `${loserName} has no legal moves`,
        winner,
      },
    };
  }

  // 2. Check repetition rule
  if (state.config.maxRepetitions && state.config.maxRepetitions > 0) {
    let repetitions = 0;
    for (const key of nextPositionHistory) {
      if (key === posKey) {
        repetitions++;
      }
    }
    if (repetitions >= state.config.maxRepetitions) {
      return {
        ...tentativeState,
        status: GameStatus.DRAW,
        result: {
          status: GameStatus.DRAW,
          reason: 'Draw by repetition',
          winner: null,
        },
      };
    }
  }

  // 3. Check move limit without capture
  if (
    state.config.maxMovesWithoutCapture !== undefined &&
    nextHalfMoveClock >= state.config.maxMovesWithoutCapture
  ) {
    return {
      ...tentativeState,
      status: GameStatus.DRAW,
      result: {
        status: GameStatus.DRAW,
        reason: 'Draw by move limit without capture',
        winner: null,
      },
    };
  }

  // 4. Check total move limit
  if (
    state.config.moveLimit !== undefined &&
    nextMoveCount >= state.config.moveLimit
  ) {
    return {
      ...tentativeState,
      status: GameStatus.DRAW,
      result: {
        status: GameStatus.DRAW,
        reason: 'Draw by move limit reached',
        winner: null,
      },
    };
  }

  return tentativeState;
}

export function isGameOver(state: GameState): boolean {
  return state.status !== GameStatus.PLAYING;
}

export function getGameResult(state: GameState): GameResult {
  if (state.result) {
    return state.result;
  }

  switch (state.status) {
    case GameStatus.WHITE_WINS:
      return { status: GameStatus.WHITE_WINS, reason: 'White wins', winner: Player.WHITE };
    case GameStatus.BLACK_WINS:
      return { status: GameStatus.BLACK_WINS, reason: 'Black wins', winner: Player.BLACK };
    case GameStatus.DRAW:
      return { status: GameStatus.DRAW, reason: 'Draw', winner: null };
    case GameStatus.PLAYING:
    default:
      return { status: GameStatus.PLAYING, reason: 'Game in progress', winner: null };
  }
}

export function handleResign(state: GameState, player: Player): GameState {
  if (state.status !== GameStatus.PLAYING) {
    return state;
  }

  const winner = player === Player.WHITE ? Player.BLACK : Player.WHITE;
  const status = winner === Player.WHITE ? GameStatus.WHITE_WINS : GameStatus.BLACK_WINS;
  const resigningName = player === Player.WHITE ? 'White' : 'Black';

  return {
    ...state,
    status,
    drawOffer: null,
    result: {
      status,
      reason: `${resigningName} resigned`,
      winner,
    },
  };
}

export function handleDrawOffer(state: GameState, player: Player): GameState {
  if (state.status !== GameStatus.PLAYING) {
    return state;
  }

  return {
    ...state,
    drawOffer: player,
  };
}

export function handleDrawAccept(state: GameState): GameState {
  if (state.status !== GameStatus.PLAYING || !state.drawOffer) {
    return state;
  }

  return {
    ...state,
    status: GameStatus.DRAW,
    drawOffer: null,
    result: {
      status: GameStatus.DRAW,
      reason: 'Draw agreed by both players',
      winner: null,
    },
  };
}

export function serializeGame(state: GameState): string {
  const serializable = {
    board: serializeBoard(state.board),
    currentPlayer: state.currentPlayer,
    moveHistory: state.moveHistory,
    status: state.status,
    moveCount: state.moveCount,
    drawOffer: state.drawOffer,
    result: state.result,
    config: state.config,
    halfMoveClock: state.halfMoveClock,
    positionHistory: state.positionHistory,
  };

  return JSON.stringify(serializable);
}

export function deserializeGame(data: string): GameState {
  const parsed = JSON.parse(data);

  return {
    board: deserializeBoard(parsed.board),
    currentPlayer: parsed.currentPlayer,
    moveHistory: parsed.moveHistory ?? [],
    status: parsed.status,
    moveCount: parsed.moveCount ?? 0,
    drawOffer: parsed.drawOffer ?? null,
    result: parsed.result,
    config: parsed.config ?? { ...DEFAULT_CONFIG },
    halfMoveClock: parsed.halfMoveClock ?? 0,
    positionHistory: parsed.positionHistory ?? [],
  };
}
