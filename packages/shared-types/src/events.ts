import type {
  GameMode,
  GameResult,
  PlayerColor,
  ResultReason,
} from './enums.js';
import type { BoardCoordinate, GameModel, MoveModel } from './models.js';

export namespace SocketEvents {
  // Client -> Server Events
  export const QUEUE_JOIN = 'queue:join' as const;
  export const QUEUE_LEAVE = 'queue:leave' as const;
  export const GAME_JOIN = 'game:join' as const;
  export const GAME_MOVE = 'game:move' as const;
  export const GAME_RESIGN = 'game:resign' as const;
  export const GAME_DRAW_OFFER = 'game:draw_offer' as const;
  export const GAME_DRAW_ACCEPT = 'game:draw_accept' as const;
  export const GAME_DRAW_DECLINE = 'game:draw_decline' as const;
  export const PING = 'ping' as const;

  // Server -> Client Events
  export const QUEUE_JOINED = 'queue:joined' as const;
  export const QUEUE_LEFT = 'queue:left' as const;
  export const MATCH_FOUND = 'match:found' as const;
  export const GAME_STATE = 'game:state' as const;
  export const GAME_MOVE_ACCEPTED = 'game:move_accepted' as const;
  export const GAME_MOVE_REJECTED = 'game:move_rejected' as const;
  export const GAME_DRAW_OFFERED = 'game:draw_offered' as const;
  export const GAME_DRAW_DECLINED = 'game:draw_declined' as const;
  export const GAME_OPPONENT_DISCONNECTED = 'game:opponent_disconnected' as const;
  export const GAME_OPPONENT_RECONNECTED = 'game:opponent_reconnected' as const;
  export const GAME_FINISHED = 'game:finished' as const;
  export const ERROR = 'error' as const;
  export const PONG = 'pong' as const;
}

// Payloads: Client -> Server
export interface QueueJoinPayload {
  mode: GameMode;
  rated?: boolean;
}

export interface QueueLeavePayload {
  mode: GameMode;
}

export interface GameJoinPayload {
  gameId: string;
}

export interface GameMovePayload {
  gameId: string;
  from: BoardCoordinate;
  to: BoardCoordinate;
  sequence?: BoardCoordinate[]; // For multi-jump moves
}

export interface GameResignPayload {
  gameId: string;
}

export interface GameDrawOfferPayload {
  gameId: string;
}

export interface GameDrawAcceptPayload {
  gameId: string;
}

export interface GameDrawDeclinePayload {
  gameId: string;
}

// Payloads: Server -> Client
export interface QueueJoinedPayload {
  mode: GameMode;
  positionInQueue: number;
}

export interface MatchFoundPayload {
  gameId: string;
  opponent: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    rating: number;
  };
  color: PlayerColor;
  mode: GameMode;
  timeControl: {
    initialSeconds: number;
    incrementSeconds: number;
  };
}

export interface GameStatePayload {
  game: GameModel;
  moves: MoveModel[];
  whitePlayer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    rating: number;
    isOnline: boolean;
  };
  blackPlayer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    rating: number;
    isOnline: boolean;
  };
}

export interface GameMoveAcceptedPayload {
  gameId: string;
  move: MoveModel;
  nextTurn: PlayerColor;
  whiteTimeLeftMs: number;
  blackTimeLeftMs: number;
}

export interface GameMoveRejectedPayload {
  gameId: string;
  reason: string;
}

export interface GameDrawOfferedPayload {
  gameId: string;
  offeredByColor: PlayerColor;
}

export interface GameDrawDeclinedPayload {
  gameId: string;
  declinedByColor: PlayerColor;
}

export interface GameOpponentDisconnectedPayload {
  gameId: string;
  disconnectedColor: PlayerColor;
  gracePeriodSeconds: number;
}

export interface GameOpponentReconnectedPayload {
  gameId: string;
  reconnectedColor: PlayerColor;
}

export interface GameFinishedPayload {
  gameId: string;
  result: GameResult;
  reason: ResultReason;
  winnerId: string | null;
  ratingUpdates?: {
    userId: string;
    oldRating: number;
    newRating: number;
    change: number;
  }[];
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}

// Mapping interfaces
export interface ClientToServerEvents {
  'queue:join': (payload: QueueJoinPayload) => void;
  'queue:leave': (payload: QueueLeavePayload) => void;
  'game:join': (payload: GameJoinPayload) => void;
  'game:move': (payload: GameMovePayload) => void;
  'game:resign': (payload: GameResignPayload) => void;
  'game:draw_offer': (payload: GameDrawOfferPayload) => void;
  'game:draw_accept': (payload: GameDrawAcceptPayload) => void;
  'game:draw_decline': (payload: GameDrawDeclinePayload) => void;
  ping: () => void;
}

export interface ServerToClientEvents {
  'queue:joined': (payload: QueueJoinedPayload) => void;
  'queue:left': () => void;
  'match:found': (payload: MatchFoundPayload) => void;
  'game:state': (payload: GameStatePayload) => void;
  'game:move_accepted': (payload: GameMoveAcceptedPayload) => void;
  'game:move_rejected': (payload: GameMoveRejectedPayload) => void;
  'game:draw_offered': (payload: GameDrawOfferedPayload) => void;
  'game:draw_declined': (payload: GameDrawDeclinedPayload) => void;
  'game:opponent_disconnected': (payload: GameOpponentDisconnectedPayload) => void;
  'game:opponent_reconnected': (payload: GameOpponentReconnectedPayload) => void;
  'game:finished': (payload: GameFinishedPayload) => void;
  error: (payload: SocketErrorPayload) => void;
  pong: () => void;
}
