import { describe, expect, it } from 'vitest';
import { createEmptyBoard, getPieceAt, setPieceAt } from '../src/board';
import {
  applyMove,
  createInitialState,
  deserializeGame,
  getGameResult,
  handleDrawAccept,
  handleDrawOffer,
  handleResign,
  isGameOver,
  serializeGame,
  validateMove,
} from '../src/engine';
import { GameStatus, PieceType, Player } from '../src/types';

describe('Engine Module', () => {
  describe('Initial state creation', () => {
    it('creates standard initial game state', () => {
      const state = createInitialState();

      expect(state.status).toBe(GameStatus.PLAYING);
      expect(state.currentPlayer).toBe(Player.WHITE);
      expect(state.moveCount).toBe(0);
      expect(state.moveHistory).toEqual([]);
      expect(state.drawOffer).toBeNull();
      expect(state.halfMoveClock).toBe(0);
      expect(state.positionHistory.length).toBe(1);
      expect(isGameOver(state)).toBe(false);

      const result = getGameResult(state);
      expect(result.status).toBe(GameStatus.PLAYING);
    });
  });

  describe('Applying moves and validation', () => {
    it('applies a valid move and updates state correctly', () => {
      const state = createInitialState();
      const move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 1 },
      };

      const validation = validateMove(state, move);
      expect(validation.valid).toBe(true);

      const nextState = applyMove(state, move);

      // Old state must NOT be mutated (pure functional requirement)
      expect(getPieceAt(state.board, { row: 5, col: 2 })).not.toBeNull();
      expect(getPieceAt(state.board, { row: 4, col: 1 })).toBeNull();
      expect(state.currentPlayer).toBe(Player.WHITE);
      expect(state.moveCount).toBe(0);

      // Next state must reflect the move
      expect(getPieceAt(nextState.board, { row: 5, col: 2 })).toBeNull();
      expect(getPieceAt(nextState.board, { row: 4, col: 1 })?.player).toBe(Player.WHITE);
      expect(nextState.currentPlayer).toBe(Player.BLACK);
      expect(nextState.moveCount).toBe(1);
      expect(nextState.moveHistory.length).toBe(1);
      expect(nextState.moveHistory[0]?.from).toEqual({ row: 5, col: 2 });
      expect(nextState.moveHistory[0]?.to).toEqual({ row: 4, col: 1 });
      expect(nextState.moveHistory[0]?.player).toBe(Player.WHITE);
    });

    it('rejects move when not player’s turn', () => {
      const state = createInitialState();
      const blackMove = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 0 },
      };

      const validation = validateMove(state, blackMove, Player.BLACK);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Not BLACK');
      expect(() => applyMove(state, blackMove)).toThrow();
    });

    it('rejects move from empty square', () => {
      const state = createInitialState();
      const emptyMove = {
        from: { row: 3, col: 2 },
        to: { row: 4, col: 1 },
      };

      const validation = validateMove(state, emptyMove);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('No piece');
    });

    it('rejects non-capture move when capture is mandatory', () => {
      const state = createInitialState();
      const board = createEmptyBoard();
      // White can capture
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
      // Another white piece
      setPieceAt(board, { row: 6, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 6, col: 1 },
      });
      state.board = board;

      const nonCaptureMove = {
        from: { row: 6, col: 1 },
        to: { row: 5, col: 0 },
      };

      const validation = validateMove(state, nonCaptureMove);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Capture is mandatory');
      expect(() => applyMove(state, nonCaptureMove)).toThrow(/Capture is mandatory/);
    });
  });

  describe('Promotion rules', () => {
    it('promotes regular piece to KING on reaching back row with simple move', () => {
      const state = createInitialState();
      const board = createEmptyBoard();
      setPieceAt(board, { row: 1, col: 2 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 1, col: 2 },
      });
      // Black dummy piece so game is not immediately over
      setPieceAt(board, { row: 7, col: 6 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 7, col: 6 },
      });
      state.board = board;

      const promoteMove = {
        from: { row: 1, col: 2 },
        to: { row: 0, col: 1 },
      };

      const nextState = applyMove(state, promoteMove);
      const piece = getPieceAt(nextState.board, { row: 0, col: 1 });
      expect(piece?.type).toBe(PieceType.KING);
      expect(piece?.player).toBe(Player.WHITE);
      expect(nextState.moveHistory[0]?.promotion).toBe(true);
    });

    it('promotes during multi-capture and executes full chain', () => {
      const state = createInitialState();
      const board = createEmptyBoard();

      // White at (2, 1) jumps (1, 2) to (0, 3) -> promotes to KING!
      setPieceAt(board, { row: 2, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.MAN,
        position: { row: 2, col: 1 },
      });
      setPieceAt(board, { row: 1, col: 2 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 1, col: 2 },
      });
      // King jumps (2, 5) to (3, 6)
      setPieceAt(board, { row: 2, col: 5 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 2, col: 5 },
      });
      // Additional black piece so Black is not wiped out
      setPieceAt(board, { row: 7, col: 6 }, {
        player: Player.BLACK,
        type: PieceType.MAN,
        position: { row: 7, col: 6 },
      });
      state.board = board;

      const multiCaptureMove = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 6 },
        captures: [
          { row: 1, col: 2 },
          { row: 2, col: 5 },
        ],
      };

      const nextState = applyMove(state, multiCaptureMove);
      const piece = getPieceAt(nextState.board, { row: 3, col: 6 });
      expect(piece?.type).toBe(PieceType.KING);
      expect(piece?.player).toBe(Player.WHITE);
      expect(getPieceAt(nextState.board, { row: 1, col: 2 })).toBeNull();
      expect(getPieceAt(nextState.board, { row: 2, col: 5 })).toBeNull();
      expect(nextState.moveHistory[0]?.promotion).toBe(true);
    });
  });

  describe('Game over detection', () => {
    it('detects loss when opponent has no legal moves left', () => {
      const state = createInitialState();
      const board = createEmptyBoard();
      // White captures the last black piece
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

      const nextState = applyMove(state, {
        from: { row: 3, col: 2 },
        to: { row: 1, col: 4 },
        captures: [{ row: 2, col: 3 }],
      });

      expect(nextState.status).toBe(GameStatus.WHITE_WINS);
      expect(isGameOver(nextState)).toBe(true);
      const result = getGameResult(nextState);
      expect(result.status).toBe(GameStatus.WHITE_WINS);
      expect(result.winner).toBe(Player.WHITE);
      expect(result.reason).toContain('Black has no legal moves');
    });
  });

  describe('Resign functionality', () => {
    it('handles White resignation properly', () => {
      const state = createInitialState();
      const resignedState = handleResign(state, Player.WHITE);

      expect(resignedState.status).toBe(GameStatus.BLACK_WINS);
      expect(isGameOver(resignedState)).toBe(true);
      const result = getGameResult(resignedState);
      expect(result.status).toBe(GameStatus.BLACK_WINS);
      expect(result.winner).toBe(Player.BLACK);
      expect(result.reason).toContain('White resigned');
    });

    it('handles Black resignation properly', () => {
      const state = createInitialState();
      const resignedState = handleResign(state, Player.BLACK);

      expect(resignedState.status).toBe(GameStatus.WHITE_WINS);
      expect(isGameOver(resignedState)).toBe(true);
      const result = getGameResult(resignedState);
      expect(result.winner).toBe(Player.WHITE);
      expect(result.reason).toContain('Black resigned');
    });

    it('does not resign if game is already over', () => {
      const state = createInitialState();
      const resignedState = handleResign(state, Player.WHITE);
      const secondResign = handleResign(resignedState, Player.BLACK);

      expect(secondResign.status).toBe(GameStatus.BLACK_WINS);
    });
  });

  describe('Draw offer and acceptance', () => {
    it('sets drawOffer on handleDrawOffer', () => {
      const state = createInitialState();
      const offered = handleDrawOffer(state, Player.WHITE);

      expect(offered.drawOffer).toBe(Player.WHITE);
      expect(offered.status).toBe(GameStatus.PLAYING);
    });

    it('ends in draw on handleDrawAccept', () => {
      const state = createInitialState();
      const offered = handleDrawOffer(state, Player.WHITE);
      const accepted = handleDrawAccept(offered);

      expect(accepted.status).toBe(GameStatus.DRAW);
      expect(isGameOver(accepted)).toBe(true);
      expect(accepted.drawOffer).toBeNull();
      const result = getGameResult(accepted);
      expect(result.status).toBe(GameStatus.DRAW);
      expect(result.winner).toBeNull();
    });

    it('cancels pending draw offer when a move is played instead of accepting', () => {
      const state = createInitialState();
      const offered = handleDrawOffer(state, Player.WHITE);
      expect(offered.drawOffer).toBe(Player.WHITE);

      const nextState = applyMove(offered, {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 1 },
      });

      expect(nextState.drawOffer).toBeNull();
      expect(nextState.status).toBe(GameStatus.PLAYING);
    });
  });

  describe('Automatic draw by repetition', () => {
    it('declares draw when the same position occurs 3 times', () => {
      const state = createInitialState({ maxRepetitions: 3 });
      const board = createEmptyBoard();

      // White King at (0, 1) and Black King at (7, 4) - separate non-intersecting diagonals
      setPieceAt(board, { row: 0, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 0, col: 1 },
      });
      setPieceAt(board, { row: 7, col: 4 }, {
        player: Player.BLACK,
        type: PieceType.KING,
        position: { row: 7, col: 4 },
      });
      state.board = board;
      state.positionHistory = [];

      let current = state;
      // Oscillate White King between (0, 1) and (1, 2), Black King between (7, 4) and (6, 5)
      for (let i = 0; i < 3; i++) {
        // Move 1: White (0,1) -> (1,2)
        current = applyMove(current, { from: { row: 0, col: 1 }, to: { row: 1, col: 2 } });
        if (current.status === GameStatus.DRAW) break;
        // Move 2: Black (7,4) -> (6,5)
        current = applyMove(current, { from: { row: 7, col: 4 }, to: { row: 6, col: 5 } });
        if (current.status === GameStatus.DRAW) break;
        // Move 3: White (1,2) -> (0,1)
        current = applyMove(current, { from: { row: 1, col: 2 }, to: { row: 0, col: 1 } });
        if (current.status === GameStatus.DRAW) break;
        // Move 4: Black (6,5) -> (7,4)
        current = applyMove(current, { from: { row: 6, col: 5 }, to: { row: 7, col: 4 } });
        if (current.status === GameStatus.DRAW) break;
      }

      expect(current.status).toBe(GameStatus.DRAW);
      expect(isGameOver(current)).toBe(true);
      expect(getGameResult(current).reason).toContain('repetition');
    });
  });

  describe('Automatic draw by move limit', () => {
    it('declares draw when maxMovesWithoutCapture is reached by kings', () => {
      const state = createInitialState({ maxMovesWithoutCapture: 4 });
      const board = createEmptyBoard();

      setPieceAt(board, { row: 0, col: 1 }, {
        player: Player.WHITE,
        type: PieceType.KING,
        position: { row: 0, col: 1 },
      });
      setPieceAt(board, { row: 7, col: 4 }, {
        player: Player.BLACK,
        type: PieceType.KING,
        position: { row: 7, col: 4 },
      });
      state.board = board;

      let current = state;
      current = applyMove(current, { from: { row: 0, col: 1 }, to: { row: 1, col: 2 } });
      current = applyMove(current, { from: { row: 7, col: 4 }, to: { row: 6, col: 5 } });
      current = applyMove(current, { from: { row: 1, col: 2 }, to: { row: 2, col: 3 } });
      current = applyMove(current, { from: { row: 6, col: 5 }, to: { row: 5, col: 6 } });

      expect(current.status).toBe(GameStatus.DRAW);
      expect(isGameOver(current)).toBe(true);
      expect(getGameResult(current).reason).toContain('move limit without capture');
    });

    it('declares draw when total moveLimit is reached', () => {
      const state = createInitialState({ moveLimit: 2 });
      let current = state;

      current = applyMove(current, { from: { row: 5, col: 2 }, to: { row: 4, col: 1 } });
      current = applyMove(current, { from: { row: 2, col: 1 }, to: { row: 3, col: 0 } });

      expect(current.status).toBe(GameStatus.DRAW);
      expect(isGameOver(current)).toBe(true);
      expect(getGameResult(current).reason).toContain('move limit reached');
    });
  });

  describe('Serialization and Deserialization', () => {
    it('accurately serializes and deserializes the entire game state', () => {
      const state = createInitialState();
      const step1 = applyMove(state, { from: { row: 5, col: 2 }, to: { row: 4, col: 1 } });
      const step2 = applyMove(step1, { from: { row: 2, col: 1 }, to: { row: 3, col: 0 } });

      const serialized = serializeGame(step2);
      const restored = deserializeGame(serialized);

      expect(restored.status).toBe(step2.status);
      expect(restored.currentPlayer).toBe(step2.currentPlayer);
      expect(restored.moveCount).toBe(step2.moveCount);
      expect(restored.moveHistory.length).toBe(2);
      expect(restored.halfMoveClock).toBe(step2.halfMoveClock);
      expect(restored.positionHistory).toEqual(step2.positionHistory);

      // Verify that further moves can be played on restored state
      const step3 = applyMove(restored, { from: { row: 5, col: 4 }, to: { row: 4, col: 3 } });
      expect(step3.moveCount).toBe(3);
    });
  });
});
