import { describe, expect, it } from 'vitest';
import { createEmptyBoard, setPieceAt } from '../src/board';
import { createInitialState } from '../src/engine';
import { evaluatePosition, getBestMove, minimax } from '../src/ai';
import { getLegalMoves } from '../src/moves';
import { PieceType, Player } from '../src/types';

describe('AI Module', () => {
  describe('evaluatePosition', () => {
    it('evaluates material advantage', () => {
      const state = createInitialState();
      const board = createEmptyBoard();

      // White has 2 men, Black has 1 man
      setPieceAt(board, { row: 5, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });
      setPieceAt(board, { row: 5, col: 4 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 4 },
      });
      setPieceAt(board, { row: 2, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 3 },
      });
      state.board = board;

      const whiteEval = evaluatePosition(state, Player.WHITE);
      const blackEval = evaluatePosition(state, Player.BLACK);

      expect(whiteEval).toBeGreaterThan(0);
      expect(blackEval).toBeLessThan(0);
      expect(whiteEval).toBe(-blackEval);
    });

    it('values KING significantly higher than regular MAN', () => {
      const state = createInitialState();
      const board = createEmptyBoard();

      // White has 1 King, Black has 1 Man
      setPieceAt(board, { row: 3, col: 4 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 3, col: 4 },
      });
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });
      state.board = board;

      const evalScore = evaluatePosition(state, Player.WHITE);
      expect(evalScore).toBeGreaterThan(150);
    });
  });

  describe('getBestMove', () => {
    it('returns a legal move from initial position', () => {
      const state = createInitialState();
      const move = getBestMove(state, 'EASY');

      expect(move).not.toBeNull();
      const legalMoves = getLegalMoves(state, Player.WHITE);
      const isLegal = legalMoves.some(
        (m) =>
          m.from.row === move?.from.row &&
          m.from.col === move?.from.col &&
          m.to.row === move?.to.row &&
          m.to.col === move?.to.col
      );
      expect(isLegal).toBe(true);
    });

    it('executes mandatory capture when capture is available', () => {
      const state = createInitialState();
      const board = createEmptyBoard();

      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });
      setPieceAt(board, { row: 3, col: 4 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 3, col: 4 },
      });
      // Another white piece with simple moves
      setPieceAt(board, { row: 6, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 6, col: 1 },
      });
      state.board = board;

      const move = getBestMove(state, 'EASY');
      expect(move).not.toBeNull();
      expect(move?.from).toEqual({ row: 4, col: 3 });
      expect(move?.captures?.length).toBe(1);
    });

    it('returns valid moves across all difficulty levels', () => {
      const state = createInitialState();

      const easyMove = getBestMove(state, 'EASY');
      const mediumMove = getBestMove(state, 'MEDIUM');
      const hardMove = getBestMove(state, 'HARD');

      expect(easyMove).not.toBeNull();
      expect(mediumMove).not.toBeNull();
      expect(hardMove).not.toBeNull();
    });

    it('returns null when game is already over', () => {
      const state = createInitialState();
      state.board = createEmptyBoard();
      // No pieces for either player
      const move = getBestMove(state, 'EASY');
      expect(move).toBeNull();
    });
  });

  describe('minimax search', () => {
    it('chooses the move that wins the game', () => {
      const state = createInitialState();
      const board = createEmptyBoard();

      // White can capture Black's only piece to win immediately
      setPieceAt(board, { row: 3, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 3, col: 2 },
      });
      setPieceAt(board, { row: 2, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 3 },
      });
      state.board = board;

      const result = minimax(state, 2, -Infinity, Infinity, true, Player.WHITE);
      expect(result.bestMove).not.toBeNull();
      expect(result.bestMove?.from).toEqual({ row: 3, col: 2 });
      expect(result.bestMove?.to).toEqual({ row: 1, col: 4 });
      expect(result.bestMove?.captures).toEqual([{ row: 2, col: 3 }]);
    });
  });
});
