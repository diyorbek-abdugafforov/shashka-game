import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  GameMode,
  PlayerColor,
  GameStatus,
  type BoardCoordinate,
  type MatchFoundPayload,
  type GameStatePayload,
  type GameMoveAcceptedPayload,
  type GameFinishedPayload,
  type QueueJoinedPayload,
  type SocketErrorPayload,
} from '@shashka/shared-types';
import { createInitialBoard } from '@shashka/game-engine';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { triggerHaptic } from '../utils/telegram';
import { router } from '../router';
import { Swords, X, Check, Clock, AlertCircle } from 'lucide-react';

export interface ActiveOnlineUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  rating: number;
  socketId?: string;
  connectedAt?: number;
}

export interface IncomingChallenge {
  challengeId: string;
  fromUser: {
    id: string;
    displayName: string;
    username?: string | null;
    avatarUrl?: string | null;
    rating: number;
  };
  mode: GameMode;
  expiresAt: number;
}

export interface OutgoingChallenge {
  targetUserId: string;
  targetUserName: string;
  expiresAt: number;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isInQueue: boolean;
  queuePosition: number | null;
  currentMatch: MatchFoundPayload | null;
  onlineUsers: ActiveOnlineUser[];
  incomingChallenge: IncomingChallenge | null;
  outgoingChallenge: OutgoingChallenge | null;
  declinedNotification: { fromName: string } | null;
  dismissDeclinedNotification: () => void;
  sendChallenge: (targetUserId: string, targetUserName: string, mode?: GameMode) => void;
  acceptChallenge: (challengeId: string, fromUserId: string, mode?: GameMode) => void;
  declineChallenge: (challengeId: string, fromUserId: string) => void;
  cancelChallenge: (targetUserId: string) => void;
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
  onlineUsers: [],
  incomingChallenge: null,
  outgoingChallenge: null,
  declinedNotification: null,
  dismissDeclinedNotification: () => {},
  sendChallenge: () => {},
  acceptChallenge: () => {},
  declineChallenge: () => {},
  cancelChallenge: () => {},
  joinQueue: () => {},
  leaveQueue: () => {},
  joinGame: () => {},
  sendMove: () => {},
  resignGame: () => {},
  offerDraw: () => {},
  acceptDraw: () => {},
  declineDraw: () => {},
});

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://shashka-backend.onrender.com'
    : 'http://localhost:4000');

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [currentMatch, setCurrentMatch] = useState<MatchFoundPayload | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<ActiveOnlineUser[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<OutgoingChallenge | null>(null);
  const [declinedNotification, setDeclinedNotification] = useState<{ fromName: string } | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [isAcceptingChallenge, setIsAcceptingChallenge] = useState(false);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const setOnlineGameState = useGameStore((s) => s.setOnlineGameState);
  const applyOnlineMove = useGameStore((s) => s.applyOnlineMove);
  const setDrawOffer = useGameStore((s) => s.setDrawOffer);
  const setOpponentDisconnection = useGameStore((s) => s.setOpponentDisconnection);
  const setOnlineGameFinished = useGameStore((s) => s.setOnlineGameFinished);

  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: token || '',
        user: user
          ? {
              id: user.id,
              displayName: user.displayName,
              username: user.username,
              avatarUrl: user.avatarUrl,
              rating: (user as any).rating ?? 0,
            }
          : undefined,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('users:get_online');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time online users updates
    socketInstance.on('users:online', (users: ActiveOnlineUser[]) => {
      setOnlineUsers(users);
    });

    // Matchmaking queue events
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

    // Direct game challenge events
    socketInstance.on('challenge:received', (payload: { challengeId: string; fromUser: any; mode?: GameMode }) => {
      triggerHaptic('heavy');
      setIncomingChallenge({
        challengeId: payload.challengeId,
        fromUser: payload.fromUser,
        mode: payload.mode || GameMode.CLASSIC,
        expiresAt: Date.now() + 30000,
      });
      setRemainingSeconds(30);
    });

    socketInstance.on('challenge:matched', (payload: { gameId: string; color: any; opponent: any }) => {
      setIncomingChallenge(null);
      setOutgoingChallenge(null);
      setIsAcceptingChallenge(false);
      triggerHaptic('success');

      try {
        // Preload game state into store so OnlineGamePage opens IMMEDIATELY with board & players ready!
        const initialBoard = createInitialBoard();
        const isWhite = payload.color === PlayerColor.WHITE;
        const currentUser = useAuthStore.getState().user;

        setOnlineGameState(
          {
            game: {
              id: payload.gameId,
              mode: GameMode.CLASSIC,
              status: GameStatus.IN_PROGRESS,
              boardState: { matrix: initialBoard, fen: '' } as any,
              currentTurn: PlayerColor.WHITE,
              whitePlayerId: isWhite ? currentUser?.id || 'player-white' : payload.opponent?.id,
              blackPlayerId: isWhite ? payload.opponent?.id : currentUser?.id || 'player-black',
              timeControl: { initialSeconds: 180, incrementSeconds: 2 },
              whiteTimeLeftMs: 180000,
              blackTimeLeftMs: 180000,
              startedAt: new Date().toISOString(),
              moveCount: 0,
            } as any,
            moves: [],
            whitePlayer: isWhite
              ? {
                  id: currentUser?.id || '',
                  displayName: currentUser?.displayName || 'Siz',
                  avatarUrl: currentUser?.avatarUrl || null,
                  rating: (currentUser as any)?.rating ?? 0,
                  isOnline: true,
                }
              : {
                  id: payload.opponent?.id || '',
                  displayName: payload.opponent?.displayName || 'Raqib',
                  avatarUrl: payload.opponent?.avatarUrl || null,
                  rating: payload.opponent?.rating ?? 0,
                  isOnline: true,
                },
            blackPlayer: isWhite
              ? {
                  id: payload.opponent?.id || '',
                  displayName: payload.opponent?.displayName || 'Raqib',
                  avatarUrl: payload.opponent?.avatarUrl || null,
                  rating: payload.opponent?.rating ?? 0,
                  isOnline: true,
                }
              : {
                  id: currentUser?.id || '',
                  displayName: currentUser?.displayName || 'Siz',
                  avatarUrl: currentUser?.avatarUrl || null,
                  rating: (currentUser as any)?.rating ?? 0,
                  isOnline: true,
                },
          },
          currentUser?.id,
        );
      } catch (err) {
        console.warn('Error setting initial game state in challenge:matched:', err);
      }

      // Auto navigate both users to match with instant router and hard fallback!
      try {
        router.navigate(`/game/online/${payload.gameId}`);
      } catch (err) {
        console.error('Router navigation error:', err);
      }
      setTimeout(() => {
        if (!window.location.pathname.includes(payload.gameId)) {
          window.location.href = `/game/online/${payload.gameId}`;
        }
      }, 50);
    });

    socketInstance.on('challenge:declined', (payload: { challengeId: string; byUser?: { id: string; displayName: string } }) => {
      setOutgoingChallenge(null);
      setDeclinedNotification({
        fromName: payload.byUser?.displayName || "Raqib",
      });
      triggerHaptic('error');
    });

    socketInstance.on('challenge:cancelled', () => {
      setIncomingChallenge(null);
    });

    // In-game events
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
      if (payload.ratingUpdates && Array.isArray(payload.ratingUpdates)) {
        const myUpdate = (payload.ratingUpdates as any[]).find((u) => u.userId === user?.id);
        if (myUpdate && myUpdate.newRating) {
          useAuthStore.getState().updateRating(myUpdate.newRating);
        }
      }
    });

    socketInstance.on('error', (err: SocketErrorPayload) => {
      triggerHaptic('error');
      console.warn('Socket error:', err);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id, setOnlineGameState, applyOnlineMove, setDrawOffer, setOpponentDisconnection, setOnlineGameFinished]);

  // Countdown timer for incoming/outgoing challenges
  useEffect(() => {
    if (!incomingChallenge && !outgoingChallenge) return;

    const timer = setInterval(() => {
      if (incomingChallenge) {
        const left = Math.max(0, Math.ceil((incomingChallenge.expiresAt - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left <= 0) {
          setIncomingChallenge(null);
        }
      } else if (outgoingChallenge) {
        const left = Math.max(0, Math.ceil((outgoingChallenge.expiresAt - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left <= 0) {
          if (socketRef.current) {
            socketRef.current.emit('challenge:cancel', { targetUserId: outgoingChallenge.targetUserId });
          }
          setOutgoingChallenge(null);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingChallenge, outgoingChallenge]);

  // Auto-dismiss declined notification after 5s
  useEffect(() => {
    if (!declinedNotification) return;
    const timer = setTimeout(() => {
      setDeclinedNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [declinedNotification]);

  // Challenge actions
  const sendChallenge = useCallback((targetUserId: string, targetUserName: string, mode = GameMode.CLASSIC) => {
    if (socketRef.current) {
      triggerHaptic('medium');
      socketRef.current.emit('challenge:send', { targetUserId, mode });
      setOutgoingChallenge({
        targetUserId,
        targetUserName,
        expiresAt: Date.now() + 30000,
      });
      setRemainingSeconds(30);
    }
  }, []);

  const acceptChallenge = useCallback((challengeId: string, fromUserId: string, mode = GameMode.CLASSIC) => {
    const s = socketRef.current;
    if (s) {
      triggerHaptic('heavy');
      setIsAcceptingChallenge(true);
      if (!s.connected) {
        s.connect();
      }
      s.emit('challenge:accept', { challengeId, fromUserId, mode });

      // Safety timeout: dismiss loading if server takes more than 4s
      setTimeout(() => {
        setIsAcceptingChallenge(false);
      }, 4000);
    }
  }, []);

  const declineChallenge = useCallback((challengeId: string, fromUserId: string) => {
    if (socketRef.current) {
      triggerHaptic('light');
      socketRef.current.emit('challenge:decline', { challengeId, fromUserId });
      setIncomingChallenge(null);
    }
  }, []);

  const cancelChallenge = useCallback((targetUserId: string) => {
    if (socketRef.current) {
      triggerHaptic('light');
      socketRef.current.emit('challenge:cancel', { targetUserId });
      setOutgoingChallenge(null);
    }
  }, []);

  const dismissDeclinedNotification = useCallback(() => {
    setDeclinedNotification(null);
  }, []);

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
        onlineUsers,
        incomingChallenge,
        outgoingChallenge,
        declinedNotification,
        dismissDeclinedNotification,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
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

      {/* 1. INCOMING CHALLENGE POPUP MODAL */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-indigo-500/60 rounded-3xl p-5 shadow-2xl shadow-indigo-950/60 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg shadow-rose-950/40 relative">
              {incomingChallenge.fromUser.avatarUrl ? (
                <img
                  src={incomingChallenge.fromUser.avatarUrl}
                  alt={incomingChallenge.fromUser.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xl font-bold text-white">
                  {incomingChallenge.fromUser.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 border-2 border-zinc-900 flex items-center justify-center text-white">
                <Swords className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Swords className="w-3.5 h-3.5" /> O'yin taklifi
              </div>
              <h3 className="text-base font-extrabold text-white">
                {incomingChallenge.fromUser.displayName}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                sizni shashka o'yiniga taklif qilyapti!
              </p>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-semibold">
                  Reyting: ELO {incomingChallenge.fromUser.rating ?? 0}
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> {remainingSeconds}s
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-1000"
                style={{ width: `${(remainingSeconds / 30) * 100}%` }}
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
              <button
                disabled={isAcceptingChallenge}
                onClick={() => declineChallenge(incomingChallenge.challengeId, incomingChallenge.fromUser.id)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-zinc-700 disabled:opacity-50"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Rad etish</span>
              </button>

              <button
                disabled={isAcceptingChallenge}
                onClick={() => acceptChallenge(incomingChallenge.challengeId, incomingChallenge.fromUser.id, incomingChallenge.mode)}
                className={`py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 ${
                  isAcceptingChallenge ? 'opacity-80 cursor-wait' : ''
                }`}
              >
                {isAcceptingChallenge ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>O'yin ochilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Qabul qilish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OUTGOING CHALLENGE WAITING MODAL */}
      {outgoingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-400 relative">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <Swords className="w-6 h-6 text-indigo-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                O'yin taklifi yuborildi...
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">
                <strong className="text-zinc-200">{outgoingChallenge.targetUserName}</strong> javobi kutilmoqda.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-amber-400 font-semibold mt-2">
                <Clock className="w-3.5 h-3.5" /> {remainingSeconds} soniya qoldi
              </div>
            </div>

            <button
              onClick={() => cancelChallenge(outgoingChallenge.targetUserId)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-bold text-xs transition-all border border-zinc-700"
            >
              Taklifni bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* 3. CHALLENGE DECLINED NOTIFICATION TOAST */}
      {declinedNotification && (
        <div className="fixed top-5 left-4 right-4 z-50 flex items-center justify-center pointer-events-none animate-in slide-in-from-top-4 duration-200">
          <div className="pointer-events-auto max-w-md w-full bg-zinc-900/95 border border-rose-500/40 rounded-2xl p-3.5 shadow-2xl shadow-rose-950/40 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Taklif rad etildi</h4>
                <p className="text-[11px] text-zinc-300">
                  <span className="font-semibold text-rose-300">{declinedNotification.fromName}</span> o'yin taklifingizni rad etdi.
                </p>
              </div>
            </div>

            <button
              onClick={dismissDeclinedNotification}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
