import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  GameMode,
  type BoardCoordinate,
  type MatchFoundPayload,
  type GameStatePayload,
  type GameMoveAcceptedPayload,
  type GameFinishedPayload,
  type QueueJoinedPayload,
  type SocketErrorPayload,
} from '@shashka/shared-types';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { triggerHaptic } from '../utils/telegram';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isInQueue: boolean;
  queuePosition: number | null;
  currentMatch: MatchFoundPayload | null;
  joinQueue: (mode: GameMode, rated?: boolean) => void;
  leaveQueue: (mode: GameMode) => void;
  joinGame: (gameId: string) => void;
  sendMove: (gameId: string, from: BoardCoordinate, to: BoardCoordinate, sequence?: BoardCoordinate[]) => void;
  resignGame: (gameId: string) => void;
  offerDraw: (gameId: string) => void;
  acceptDraw: (gameId: string) => void;
  declineDraw: (gameId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isInQueue: false,
  queuePosition: null,
  currentMatch: null,
  joinQueue: () => {},
  leaveQueue: () => {},
  joinGame: () => {},
  sendMove: () => {},
  resignGame: () => {},
  offerDraw: () => {},
  acceptDraw: () => {},
  declineDraw: () => {},
});

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [currentMatch, setCurrentMatch] = useState<MatchFoundPayload | null>(null);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const setOnlineGameState = useGameStore((s) => s.setOnlineGameState);
  const applyOnlineMove = useGameStore((s) => s.applyOnlineMove);
  const setDrawOffer = useGameStore((s) => s.setDrawOffer);
  const setOpponentDisconnection = useGameStore((s) => s.setOpponentDisconnection);
  const setOnlineGameFinished = useGameStore((s) => s.setOnlineGameFinished);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('queue:joined', (payload: QueueJoinedPayload) => {
      setIsInQueue(true);
      setQueuePosition(payload.positionInQueue);
    });

    socketInstance.on('queue:left', () => {
      setIsInQueue(false);
      setQueuePosition(null);
    });

    socketInstance.on('match:found', (payload: MatchFoundPayload) => {
      setIsInQueue(false);
      setQueuePosition(null);
      setCurrentMatch(payload);
      triggerHaptic('success');
    });

    socketInstance.on('game:state', (payload: GameStatePayload) => {
      setOnlineGameState(payload, user?.id);
    });

    socketInstance.on('game:move_accepted', (payload: GameMoveAcceptedPayload) => {
      applyOnlineMove(payload);
    });

    socketInstance.on('game:move_rejected', () => {
      triggerHaptic('error');
    });

    socketInstance.on('game:draw_offered', (payload) => {
      setDrawOffer(payload.offeredByColor);
    });

    socketInstance.on('game:draw_declined', () => {
      setDrawOffer(null);
    });

    socketInstance.on('game:opponent_disconnected', () => {
      setOpponentDisconnection(true);
    });

    socketInstance.on('game:opponent_reconnected', () => {
      setOpponentDisconnection(false);
    });

    socketInstance.on('game:finished', (payload: GameFinishedPayload) => {
      setOnlineGameFinished(payload.result, payload.reason);
    });

    socketInstance.on('error', (err: SocketErrorPayload) => {
      triggerHaptic('error');
      console.warn('Socket error:', err);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id, setOnlineGameState, applyOnlineMove, setDrawOffer, setOpponentDisconnection, setOnlineGameFinished]);

  const joinQueue = useCallback((mode: GameMode, rated = true) => {
    if (socketRef.current) {
      socketRef.current.emit('queue:join', { mode, rated });
      setIsInQueue(true);
    }
  }, []);

  const leaveQueue = useCallback((mode: GameMode) => {
    if (socketRef.current) {
      socketRef.current.emit('queue:leave', { mode });
      setIsInQueue(false);
      setQueuePosition(null);
    }
  }, []);

  const joinGame = useCallback((gameId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:join', { gameId });
    }
  }, []);

  const sendMove = useCallback((gameId: string, from: BoardCoordinate, to: BoardCoordinate, sequence?: BoardCoordinate[]) => {
    if (socketRef.current) {
      socketRef.current.emit('game:move', { gameId, from, to, sequence });
    }
  }, []);

  const resignGame = useCallback((gameId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:resign', { gameId });
    }
  }, []);

  const offerDraw = useCallback((gameId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:draw_offer', { gameId });
    }
  }, []);

  const acceptDraw = useCallback((gameId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:draw_accept', { gameId });
    }
  }, []);

  const declineDraw = useCallback((gameId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('game:draw_decline', { gameId });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isInQueue,
        queuePosition,
        currentMatch,
        joinQueue,
        leaveQueue,
        joinGame,
        sendMove,
        resignGame,
        offerDraw,
        acceptDraw,
        declineDraw,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
