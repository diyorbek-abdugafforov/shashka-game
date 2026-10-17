import { describe, expect, it } from 'vitest';
import {
  arePositionsEqual,
  BOARD_SIZE,
  cloneBoard,
  countPieces,
  createEmptyBoard,
  createInitialBoard,
  deserializeBoard,
  getPieceAt,
  getPieces,
  isDarkSquare,
  isValidPosition,
  removePieceAt,
  serializeBoard,
  setPieceAt,
} from '../src/board';
import { PieceType, Player } from '../src/types';

describe('Board Module', () => {
  describe('createEmptyBoard', () => {
    it('creates an 8x8 board where every square is null', () => {
      const board = createEmptyBoard();
      expect(board.length).toBe(BOARD_SIZE);
      for (let r = 0; r < BOARD_SIZE; r++) {
        expect(board[r]?.length).toBe(BOARD_SIZE);
        for (let c = 0; c < BOARD_SIZE; c++) {
          expect(board[r]?.[c]).toBeNull();
        }
      }
    });
  });

  describe('createInitialBoard', () => {
    it('creates standard Russian checkers starting board', () => {
      const board = createInitialBoard();
      const counts = countPieces(board);

      expect(counts.white).toBe(12);
      expect(counts.black).toBe(12);
      expect(counts.whiteKings).toBe(0);
      expect(counts.blackKings).toBe(0);

      // Black pieces on rows 0-2 on dark squares
      for (let r = 0; r <= 2; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const piece = board[r]?.[c];
          if ((r + c) % 2 === 1) {
            expect(piece).not.toBeNull();
            expect(piece?.player).toBe(Player.BLACK);
            expect(piece?.type).toBe(PieceType.MAN);
            expect(piece?.position).toEqual({ row: r, col: c });
          } else {
            expect(piece).toBeNull();
          }
        }
      }

      // Middle rows 3-4 must be empty
      for (let r = 3; r <= 4; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          expect(board[r]?.[c]).toBeNull();
        }
      }

      // White pieces on rows 5-7 on dark squares
      for (let r = 5; r <= 7; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const piece = board[r]?.[c];
          if ((r + c) % 2 === 1) {
            expect(piece).not.toBeNull();
            expect(piece?.player).toBe(Player.WHITE);
            expect(piece?.type).toBe(PieceType.MAN);
            expect(piece?.position).toEqual({ row: r, col: c });
          } else {
            expect(piece).toBeNull();
          }
        }
      }
    });
  });

  describe('isValidPosition & isDarkSquare', () => {
    it('validates positions within bounds', () => {
      expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
      expect(isValidPosition({ row: 7, col: 7 })).toBe(true);
      expect(isValidPosition({ row: 3, col: 4 })).toBe(true);

      expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
      expect(isValidPosition({ row: 8, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 0, col: 8 })).toBe(false);
      expect(isValidPosition({ row: 2.5, col: 3 })).toBe(false);
    });

    it('identifies dark squares correctly', () => {
      // (row + col) % 2 === 1 is dark square
      expect(isDarkSquare({ row: 0, col: 1 })).toBe(true);
      expect(isDarkSquare({ row: 0, col: 0 })).toBe(false);
      expect(isDarkSquare({ row: 7, col: 0 })).toBe(true);
      expect(isDarkSquare({ row: 7, col: 7 })).toBe(false);
      expect(isDarkSquare({ row: -1, col: 2 })).toBe(false);
    });

    it('checks position equality', () => {
      expect(arePositionsEqual({ row: 2, col: 3 }, { row: 2, col: 3 })).toBe(true);
      expect(arePositionsEqual({ row: 2, col: 3 }, { row: 3, col: 2 })).toBe(false);
    });
  });

  describe('Board manipulation (get, set, remove, clone)', () => {
    it('sets and gets pieces properly', () => {
      const board = createEmptyBoard();
      const pos = { row: 4, col: 3 };

      setPieceAt(board, pos, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: pos,
      });

      const piece = getPieceAt(board, pos);
      expect(piece).not.toBeNull();
      expect(piece?.player).toBe(Player.WHITE);
      expect(piece?.type).toBe(PieceType.KING);
      expect(piece?.position).toEqual(pos);
    });

    it('handles out of bounds safely', () => {
      const board = createEmptyBoard();
      expect(getPieceAt(board, { row: 99, col: 99 })).toBeNull();
      expect(removePieceAt(board, { row: -5, col: 0 })).toBeNull();
      // setPieceAt on invalid pos does nothing and does not throw
      setPieceAt(board, { row: -1, col: -1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: -1, col: -1 },
      });
    });

    it('removes piece and returns previous piece', () => {
      const board = createInitialBoard();
      const pos = { row: 5, col: 0 };
      const piece = getPieceAt(board, pos);
      expect(piece).not.toBeNull();

      const removed = removePieceAt(board, pos);
      expect(removed).toEqual(piece);
      expect(getPieceAt(board, pos)).toBeNull();
    });

    it('deep clones the board and pieces without side effects', () => {
      const original = createInitialBoard();
      const clone = cloneBoard(original);

      expect(countPieces(clone)).toEqual(countPieces(original));

      // Modify clone
      removePieceAt(clone, { row: 5, col: 0 });
      expect(getPieceAt(clone, { row: 5, col: 0 })).toBeNull();
      expect(getPieceAt(original, { row: 5, col: 0 })).not.toBeNull();

      // Modify piece in clone
      const clonePiece = getPieceAt(clone, { row: 5, col: 2 });
      if (clonePiece) {
        clonePiece.type = PieceType.KING;
      }
      expect(getPieceAt(original, { row: 5, col: 2 })?.type).toBe(PieceType.MAN);
    });

    it('retrieves pieces by player', () => {
      const board = createInitialBoard();
      const whitePieces = getPieces(board, Player.WHITE);
      const blackPieces = getPieces(board, Player.BLACK);
      const allPieces = getPieces(board);

      expect(whitePieces.length).toBe(12);
      expect(blackPieces.length).toBe(12);
      expect(allPieces.length).toBe(24);
      expect(whitePieces.every((p) => p.player === Player.WHITE)).toBe(true);
      expect(blackPieces.every((p) => p.player === Player.BLACK)).toBe(true);
    });
  });

  describe('Serialization and Deserialization', () => {
    it('round trips initial board with compact string format', () => {
      const board = createInitialBoard();
      const serialized = serializeBoard(board);
      const restored = deserializeBoard(serialized);

      expect(countPieces(restored)).toEqual(countPieces(board));
      expect(serializeBoard(restored)).toBe(serialized);
    });

    it('round trips board containing kings and men', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 0, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 0, col: 1 },
      });
      setPieceAt(board, { row: 7, col: 6 }, {
        player: Player.BLACK,
        type: PieceType.KING,
        position: { row: 7, col: 6 },
      });
      setPieceAt(board, { row: 3, col: 4 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 3, col: 4 },
      });

      const serialized = serializeBoard(board);
      const restored = deserializeBoard(serialized);

      expect(getPieceAt(restored, { row: 0, col: 1 })?.type).toBe(PieceType.KING);
      expect(getPieceAt(restored, { row: 0, col: 1 })?.player).toBe(Player.WHITE);
      expect(getPieceAt(restored, { row: 7, col: 6 })?.type).toBe(PieceType.KING);
      expect(getPieceAt(restored, { row: 7, col: 6 })?.player).toBe(Player.BLACK);
      expect(getPieceAt(restored, { row: 3, col: 4 })?.type).toBe(PieceType.MAN);
    });

    it('supports JSON deserialization', () => {
      const board = createEmptyBoard();
      setPieceAt(board, { row: 2, col: 3 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 2, col: 3 },
      });

      const jsonStr = JSON.stringify(board);
      const restored = deserializeBoard(jsonStr);
      expect(getPieceAt(restored, { row: 2, col: 3 })?.player).toBe(Player.WHITE);
    });
  });
});
