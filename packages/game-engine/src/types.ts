export enum Player {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
}

export enum PieceType {
  MAN = 'MAN',
  KING = 'KING',
}

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  player: Player;
  type: PieceType;
  position: Position;
}

export type Board = (Piece | null)[][];

export interface Move {
  from: Position;
  to: Position;
  captures?: Position[];
  promotion?: boolean;
  path?: Position[];
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}

export interface GameResult {
  status: GameStatus;
  reason?: string;
  winner?: Player | null;
}

export interface GameConfig {
  maxMovesWithoutCapture?: number;
  maxRepetitions?: number;
  moveLimit?: number;
}

export interface MoveHistoryEntry extends Move {
  player: Player;
  pieceType: PieceType;
  boardStateAfter?: string;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  moveHistory: MoveHistoryEntry[];
  status: GameStatus;
  moveCount: number;
  drawOffer?: Player | null;
  result?: GameResult;
  config: GameConfig;
  halfMoveClock: number;
  positionHistory: string[];
}

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
