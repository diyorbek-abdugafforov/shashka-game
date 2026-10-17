import { describe, expect, it } from 'vitest';
import { createEmptyBoard, createInitialBoard, setPieceAt } from '../src/board';
import { createInitialState } from '../src/engine';
import {
  getCaptures,
  getLegalMoves,
  getSimpleMoves,
  isCaptureAvailable,
} from '../src/moves';
import { GameState, GameStatus, PieceType, Player } from '../src/types';

describe('Moves Module', () => {
  describe('Simple moves for regular pieces (MAN)', () => {
    it('generates forward diagonal moves for White', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 5, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });

      const moves = getSimpleMoves(board, { row: 5, col: 2 });
      expect(moves.length).toBe(2);
      expect(moves).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ from: { row: 5, col: 2 }, to: { row: 4, col: 1 } }),
          expect.objectContaining({ from: { row: 5, col: 2 }, to: { row: 4, col: 3 } }),
        ])
      );
    });

    it('generates forward diagonal moves for Black', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 2, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 3 },
      });

      const moves = getSimpleMoves(board, { row: 2, col: 3 });
      expect(moves.length).toBe(2);
      expect(moves).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ from: { row: 2, col: 3 }, to: { row: 3, col: 2 } }),
          expect.objectContaining({ from: { row: 2, col: 3 }, to: { row: 3, col: 4 } }),
        ])
      );
    });

    it('handles piece on board edge with only 1 move', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 5, col: 0 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 0 },
      });

      const moves = getSimpleMoves(board, { row: 5, col: 0 });
      expect(moves.length).toBe(1);
      expect(moves[0]?.to).toEqual({ row: 4, col: 1 });
    });

    it('returns empty moves if piece is blocked by friendly pieces', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 5, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });
      setPieceAt(board, { row: 4, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 4, col: 1 },
      });
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });

      const moves = getSimpleMoves(board, { row: 5, col: 2 });
      expect(moves.length).toBe(0);
    });
  });

  describe('Capture moves for regular pieces (forward & backward)', () => {
    it('captures forward for White', () => {
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

      const captures = getCaptures(board, { row: 4, col: 3 });
      expect(captures.length).toBe(1);
      expect(captures[0]?.to).toEqual({ row: 2, col: 5 });
      expect(captures[0]?.captures).toEqual([{ row: 3, col: 4 }]);
    });

    it('captures backward for White (Russian checkers rule)', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 3, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 3, col: 2 },
      });
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });

      const captures = getCaptures(board, { row: 3, col: 2 });
      expect(captures.length).toBe(1);
      expect(captures[0]?.to).toEqual({ row: 5, col: 4 });
      expect(captures[0]?.captures).toEqual([{ row: 4, col: 3 }]);
    });

    it('captures backward for Black', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 5, col: 4 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 5, col: 4 },
      });
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });

      const captures = getCaptures(board, { row: 5, col: 4 });
      expect(captures.length).toBe(1);
      expect(captures[0]?.to).toEqual({ row: 3, col: 2 });
      expect(captures[0]?.captures).toEqual([{ row: 4, col: 3 }]);
    });

    it('cannot capture friendly pieces', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });
      setPieceAt(board, { row: 3, col: 4 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 3, col: 4 },
      });

      const captures = getCaptures(board, { row: 4, col: 3 });
      expect(captures.length).toBe(0);
    });

    it('cannot capture if landing square is occupied', () => {
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
      setPieceAt(board, { row: 2, col: 5 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 5 },
      });

      const captures = getCaptures(board, { row: 4, col: 3 });
      expect(captures.length).toBe(0);
    });
  });

  describe('Mandatory capture rule', () => {
    it('detects available capture', () => {
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
      // Block Black's landing square (5, 2) so only White can capture
      setPieceAt(board, { row: 5, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });

      expect(isCaptureAvailable(board, Player.WHITE)).toBe(true);
      expect(isCaptureAvailable(board, Player.BLACK)).toBe(false);
    });

    it('only returns capture moves when capture is available', () => {
      const state = createInitialState();
      const board = createEmptyBoard();
      // White piece that can capture
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });
      // Enemy piece
      setPieceAt(board, { row: 3, col: 4 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 3, col: 4 },
      });
      // Another White piece with only simple moves
      setPieceAt(board, { row: 6, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 6, col: 1 },
      });
      state.board = board;

      const legalMoves = getLegalMoves(state, Player.WHITE);
      expect(legalMoves.length).toBe(1);
      expect(legalMoves[0]?.captures?.length).toBe(1);
      expect(legalMoves[0]?.from).toEqual({ row: 4, col: 3 });
    });
  });

  describe('Multi-capture chains', () => {
    it('executes straight double capture', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 5, col: 0 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 0 },
      });
      setPieceAt(board, { row: 4, col: 1 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 4, col: 1 },
      });
      setPieceAt(board, { row: 2, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 3 },
      });

      const captures = getCaptures(board, { row: 5, col: 0 });
      expect(captures.length).toBe(1);
      expect(captures[0]?.to).toEqual({ row: 1, col: 4 });
      expect(captures[0]?.captures).toEqual([
        { row: 4, col: 1 },
        { row: 2, col: 3 },
      ]);
    });

    it('executes forward then backward zig-zag multi-capture', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 5, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });
      // (3, 4) is empty landing square
      // Then jump backward-left to (5, 2) is visited, so jump to (5, 6) over (4, 5)
      setPieceAt(board, { row: 4, col: 5 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 4, col: 5 },
      });

      const captures = getCaptures(board, { row: 5, col: 2 });
      expect(captures.length).toBe(1);
      expect(captures[0]?.to).toEqual({ row: 5, col: 6 });
      expect(captures[0]?.captures?.length).toBe(2);
    });

    it('cannot jump the same piece twice or land on the same square twice', () => {
      const board = createEmptyBoard();
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

      const captures = getCaptures(board, { row: 3, col: 2 });
      expect(captures.length).toBe(1);
      expect(captures[0]?.captures?.length).toBe(1);
    });
  });

  describe('King moves (flying king)', () => {
    it('moves any distance diagonally in 4 directions on empty board', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 3, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 3, col: 3 },
      });

      const moves = getSimpleMoves(board, { row: 3, col: 3 });
      // NW: (2,2), (1,1), (0,0) = 3
      // NE: (2,4), (1,5), (0,6) = 3
      // SW: (4,2), (5,1), (6,0) = 3
      // SE: (4,4), (5,5), (6,6), (7,7) = 4
      // Total = 13
      expect(moves.length).toBe(13);
    });

    it('is blocked by pieces when moving as king', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 3, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 3, col: 3 },
      });
      setPieceAt(board, { row: 1, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 1, col: 1 },
      });

      const moves = getSimpleMoves(board, { row: 3, col: 3 });
      // Cannot reach (1,1) or (0,0)
      expect(moves.some((m) => m.to.row === 1 && m.to.col === 1)).toBe(false);
      expect(moves.some((m) => m.to.row === 0 && m.to.col === 0)).toBe(false);
      expect(moves.some((m) => m.to.row === 2 && m.to.col === 2)).toBe(true);
    });
  });

  describe('King captures (long range & multi-capture)', () => {
    it('captures from long range and lands on any square beyond', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 7, col: 0 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 7, col: 0 },
      });
      setPieceAt(board, { row: 4, col: 3 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 4, col: 3 },
      });

      const captures = getCaptures(board, { row: 7, col: 0 });
      // Beyond (4,3): (3,4), (2,5), (1,6), (0,7) are all empty!
      expect(captures.length).toBe(4);
      const landingRows = captures.map((c) => c.to.row);
      expect(landingRows).toContain(3);
      expect(landingRows).toContain(2);
      expect(landingRows).toContain(1);
      expect(landingRows).toContain(0);
    });

    it('performs long-range multi-capture', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 7, col: 0 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 7, col: 0 },
      });
      setPieceAt(board, { row: 5, col: 2 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });
      // Lands at (3, 4), then jumps (2, 5) to (1, 6) or (0, 7)
      setPieceAt(board, { row: 2, col: 5 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 5 },
      });

      const captures = getCaptures(board, { row: 7, col: 0 });
      expect(captures.length).toBeGreaterThan(0);
      expect(captures.every((c) => (c.captures?.length ?? 0) === 2)).toBe(true);
    });
  });

  describe('Promotion during multi-capture', () => {
    it('promotes to King upon reaching last row during multi-capture and continues as King', () => {
      const board = createEmptyBoard();
      // White MAN at (2, 1)
      setPieceAt(board, { row: 2, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 2, col: 1 },
      });
      // Enemy at (1, 2); jump lands on (0, 3) which is promotion row!
      setPieceAt(board, { row: 1, col: 2 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 1, col: 2 },
      });
      // Enemy at (2, 5), leaving (1, 4) empty. A MAN cannot jump this, but a KING can!
      setPieceAt(board, { row: 2, col: 5 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 5 },
      });

      const captures = getCaptures(board, { row: 2, col: 1 });
      expect(captures.length).toBeGreaterThan(0);

      // Must have continued as king jumping (2,5) to land on (3,6) or (4,7)
      const multiJumps = captures.filter((c) => c.captures?.length === 2);
      expect(multiJumps.length).toBeGreaterThan(0);
      expect(multiJumps.some((c) => c.to.row === 3 || c.to.row === 4)).toBe(true);
      expect(multiJumps[0]?.promotion).toBe(true);
    });
  });

  describe('No legal moves scenario', () => {
    it('returns empty array when player has no pieces', () => {
      const state = createInitialState();
      state.board = createEmptyBoard();
      setPieceAt(state.board, { row: 0, col: 1 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 0, col: 1 },
      });

      const moves = getLegalMoves(state, Player.WHITE);
      expect(moves.length).toBe(0);
    });

    it('returns empty array when all pieces are trapped', () => {
      const state = createInitialState();
      state.board = createEmptyBoard();
      // White piece at corner trapped
      setPieceAt(state.board, { row: 7, col: 0 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 7, col: 0 },
      });
      setPieceAt(state.board, { row: 6, col: 1 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 6, col: 1 },
      });
      // (5, 2) occupied by Black, so White cannot capture
      setPieceAt(state.board, { row: 5, col: 2 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 5, col: 2 },
      });

      const moves = getLegalMoves(state, Player.WHITE);
      expect(moves.length).toBe(0);
    });

    it('returns empty array if game is not in PLAYING status', () => {
      const state = createInitialState();
      state.status = GameStatus.WHITE_WINS;
      const moves = getLegalMoves(state, Player.WHITE);
      expect(moves.length).toBe(0);
    });
  });
});
