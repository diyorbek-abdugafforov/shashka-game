import { applyMove, isGameOver } from './engine.js';
import { getLegalMoves } from './moves.js';
import {
  AIDifficulty,
  Board,
  GameState,
  GameStatus,
  Move,
  PieceType,
  Player,
} from './types.js';

export const DIFFICULTY_DEPTHS: Record<AIDifficulty, number> = {
  EASY: 2,
  MEDIUM: 4,
  HARD: 6,
};

const MAN_VALUE = 100;
const KING_VALUE = 350;

/**
 * Heuristic evaluation of a state from the perspective of a specific player.
 * Positive score favors player, negative favors opponent.
 */
export function evaluatePosition(state: GameState, player: Player): number {
  if (state.status === GameStatus.WHITE_WINS) {
    return player === Player.WHITE ? 100000 : -100000;
  }
  if (state.status === GameStatus.BLACK_WINS) {
    return player === Player.BLACK ? 100000 : -100000;
  }
  if (state.status === GameStatus.DRAW) {
    return 0;
  }

  const opponent = player === Player.WHITE ? Player.BLACK : Player.WHITE;
  const board = state.board;

  const playerScore = evaluatePlayerBoard(board, player);
  const opponentScore = evaluatePlayerBoard(board, opponent);

  const playerMoves = getLegalMoves({ ...state, currentPlayer: player }, player).length;
  const opponentMoves = getLegalMoves({ ...state, currentPlayer: opponent }, opponent).length;
  const mobilityDiff = (playerMoves - opponentMoves) * 2;

  return playerScore - opponentScore + mobilityDiff;
}

function evaluatePlayerBoard(board: Board, player: Player): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    const row = board[r];
    if (!row) continue;
    for (let c = 0; c < 8; c++) {
      const piece = row[c];
      if (!piece || piece.player !== player) continue;

      if (piece.type === PieceType.KING) {
        score += KING_VALUE;
      } else {
        score += MAN_VALUE;

        // Advancement bonus (advancing closer to king row)
        const advancement = player === Player.WHITE ? 7 - r : r;
        score += advancement * 5;

        // Back row defense bonus (holding the back row protects against king promotion)
        const isBackRow =
          (player === Player.WHITE && r === 7) ||
          (player === Player.BLACK && r === 0);
        if (isBackRow) {
          score += 15;
        }
      }

      // Center control bonus
      if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
        score += 8;
      }

      // Edge penalty (pieces on edge squares have less mobility)
      if (c === 0 || c === 7) {
        score -= 5;
      }
    }
  }

  return score;
}

/**
 * Order moves to maximize alpha-beta pruning efficiency.
 * Captures and promotions searched first.
 */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const aCaptures = a.captures ? a.captures.length : 0;
    const bCaptures = b.captures ? b.captures.length : 0;
    if (aCaptures !== bCaptures) {
      return bCaptures - aCaptures;
    }
    const aPromo = a.promotion ? 1 : 0;
    const bPromo = b.promotion ? 1 : 0;
    return bPromo - aPromo;
  });
}

/**
 * Minimax algorithm with alpha-beta pruning.
 */
export function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player
): { score: number; bestMove: Move | null } {
  if (depth === 0 || isGameOver(state)) {
    return {
      score: evaluatePosition(state, aiPlayer),
      bestMove: null,
    };
  }

  const legalMoves = getLegalMoves(state, state.currentPlayer);
  if (legalMoves.length === 0) {
    // Current player has lost
    return {
      score: evaluatePosition(state, aiPlayer),
      bestMove: null,
    };
  }

  const orderedMoves = orderMoves(legalMoves);

  if (maximizing) {
    let maxScore = -Infinity;
    let bestMove: Move | null = orderedMoves[0] ?? null;

    for (const move of orderedMoves) {
      const nextState = applyMove(state, move);
      const isNextMaximizing = nextState.currentPlayer === aiPlayer;
      const result = minimax(
        nextState,
        depth - 1,
        alpha,
        beta,
        isNextMaximizing,
        aiPlayer
      );

      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }

      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }

    return { score: maxScore, bestMove };
  } else {
    let minScore = Infinity;
    let bestMove: Move | null = orderedMoves[0] ?? null;

    for (const move of orderedMoves) {
      const nextState = applyMove(state, move);
      const isNextMaximizing = nextState.currentPlayer === aiPlayer;
      const result = minimax(
        nextState,
        depth - 1,
        alpha,
        beta,
        isNextMaximizing,
        aiPlayer
      );

      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }

      beta = Math.min(beta, minScore);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }

    return { score: minScore, bestMove };
  }
}

/**
 * Computes the best move for the current player at the chosen difficulty.
 */
export function getBestMove(
  state: GameState,
  difficulty: AIDifficulty | 'EASY' | 'MEDIUM' | 'HARD'
): Move | null {
  if (isGameOver(state)) {
    return null;
  }

  const legalMoves = getLegalMoves(state, state.currentPlayer);
  if (legalMoves.length === 0) {
    return null;
  }

  // If only one move is legal, return it immediately
  if (legalMoves.length === 1) {
    return legalMoves[0]!;
  }

  const depth = DIFFICULTY_DEPTHS[difficulty as AIDifficulty] ?? 2;
  const result = minimax(
    state,
    depth,
    -Infinity,
    Infinity,
    true,
    state.currentPlayer
  );

  return result.bestMove ?? legalMoves[0]!;
}
