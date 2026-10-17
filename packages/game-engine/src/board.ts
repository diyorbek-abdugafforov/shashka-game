import { Board, Piece, PieceType, Player, Position } from './types.js';

export const BOARD_SIZE = 8;

export function isValidPosition(pos: Position): boolean {
  if (!pos || typeof pos.row !== 'number' || typeof pos.col !== 'number') {
    return false;
  }
  return (
    Number.isInteger(pos.row) &&
    Number.isInteger(pos.col) &&
    pos.row >= 0 &&
    pos.row < BOARD_SIZE &&
    pos.col >= 0 &&
    pos.col < BOARD_SIZE
  );
}

export function isDarkSquare(posOrRow: Position | number, col?: number): boolean {
  if (typeof posOrRow === 'object' && posOrRow !== null) {
    if (!isValidPosition(posOrRow)) return false;
    return (posOrRow.row + posOrRow.col) % 2 === 1;
  }
  if (typeof posOrRow === 'number' && typeof col === 'number') {
    if (posOrRow < 0 || posOrRow >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }
    return (posOrRow + col) % 2 === 1;
  }
  return false;
}

export function arePositionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

export function createInitialBoard(): Board {
  const board = createEmptyBoard();

  // Black pieces on rows 0-2
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) {
        board[r]![c] = {
          player: Player.BLACK,
          type: PieceType.MAN,
          position: { row: r, col: c },
        };
      }
    }
  }

  // White pieces on rows 5-7
  for (let r = 5; r <= 7; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) {
        board[r]![c] = {
          player: Player.WHITE,
          type: PieceType.MAN,
          position: { row: r, col: c },
        };
      }
    }
  }

  return board;
}

export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  return board[pos.row]?.[pos.col] ?? null;
}

export function setPieceAt(board: Board, pos: Position, piece: Piece | null): void {
  if (isValidPosition(pos)) {
    board[pos.row]![pos.col] = piece ? { ...piece, position: { ...pos } } : null;
  }
}

export function removePieceAt(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  const existing = board[pos.row]?.[pos.col] ?? null;
  if (board[pos.row]) {
    board[pos.row]![pos.col] = null;
  }
  return existing;
}

export function cloneBoard(board: Board): Board {
  return board.map((row: (Piece | null)[]) =>
    row.map((cell: Piece | null) =>
      cell ? { ...cell, position: { ...cell.position } } : null
    )
  );
}

export function getPieces(board: Board, player?: Player): Piece[] {
  const pieces: Piece[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r]?.[c];
      if (piece && (player === undefined || piece.player === player)) {
        pieces.push(piece);
      }
    }
  }
  return pieces;
}

export function countPieces(board: Board): {
  white: number;
  black: number;
  whiteKings: number;
  blackKings: number;
} {
  let white = 0;
  let black = 0;
  let whiteKings = 0;
  let blackKings = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r]?.[c];
      if (piece) {
        if (piece.player === Player.WHITE) {
          white++;
          if (piece.type === PieceType.KING) whiteKings++;
        } else {
          black++;
          if (piece.type === PieceType.KING) blackKings++;
        }
      }
    }
  }
  return { white, black, whiteKings, blackKings };
}

export function serializeBoard(board: Board): string {
  return board
    .map((row: (Piece | null)[]) =>
      row
        .map((cell: Piece | null) => {
          if (!cell) return '.';
          if (cell.player === Player.WHITE) {
            return cell.type === PieceType.KING ? 'W' : 'w';
          }
          return cell.type === PieceType.KING ? 'B' : 'b';
        })
        .join('')
    )
    .join('/');
}

export function deserializeBoard(data: string): Board {
  if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed as Board;
      }
    } catch {
      // fallback to custom format
    }
  }

  const board = createEmptyBoard();
  const rows = data.split('/');
  for (let r = 0; r < BOARD_SIZE && r < rows.length; r++) {
    const row = rows[r]!;
    for (let c = 0; c < BOARD_SIZE && c < row.length; c++) {
      const ch = row[c];
      if (ch === 'w') {
        board[r]![c] = { player: Player.WHITE, type: PieceType.MAN, position: { row: r, col: c } };
      } else if (ch === 'W') {
        board[r]![c] = { player: Player.WHITE, type: PieceType.KING, position: { row: r, col: c } };
      } else if (ch === 'b') {
        board[r]![c] = { player: Player.BLACK, type: PieceType.MAN, position: { row: r, col: c } };
      } else if (ch === 'B') {
        board[r]![c] = { player: Player.BLACK, type: PieceType.KING, position: { row: r, col: c } };
      }
    }
  }
  return board;
}
