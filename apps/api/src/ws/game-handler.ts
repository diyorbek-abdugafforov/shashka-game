import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../types.js';
import {
  SocketEvents,
  PlayerColor,
  type GameJoinPayload,
  type GameMovePayload,
  type GameResignPayload,
  type GameDrawOfferPayload,
  type GameDrawAcceptPayload,
  type GameDrawDeclinePayload,
} from '@shashka/shared-types';
import { GameService } from '../services/game.service.js';
import { MatchmakingService } from '../services/matchmaking.service.js';

export function registerGameHandlers(io: Server, socket: AuthenticatedSocket) {
  const user = socket.data.user;

  // Handle client joining a game room
  socket.on(SocketEvents.GAME_JOIN, async (payload: GameJoinPayload) => {
    try {
      const { gameId } = payload;
      let game = await GameService.getGame(gameId);

      // If invite game and second player arrives, join them as Black
      if (!game.blackPlayerId && game.whitePlayerId !== user.id) {
        game = await GameService.joinInviteGame(gameId, user.id);
      }

      const moves = await GameService.getGameMoves(gameId);

      socket.join(`game:${gameId}`);
      socket.data.currentGameId = gameId;

      // Cancel reconnect timer if previously disconnected
      MatchmakingService.handleReconnect(user.id, gameId);
      socket.to(`game:${gameId}`).emit(SocketEvents.GAME_OPPONENT_RECONNECTED, {
        gameId,
        reconnectedColor:
          game.whitePlayerId === user.id ? PlayerColor.WHITE : PlayerColor.BLACK,
      });

      const statePayload = {
        game: {
          ...game,
          boardState: GameService.serializeBoard(
            GameService.deserializeBoard(game.boardState),
          ),
          startedAt: game.startedAt.toISOString(),
          finishedAt: game.finishedAt ? game.finishedAt.toISOString() : null,
          whiteTimeLeftMs: 180000,
          blackTimeLeftMs: 180000,
        },
        moves: moves.map((m) => ({
          ...m,
          from: m.from as any,
          to: m.to as any,
          captures: m.captures as any,
          timestamp: m.timestamp.toISOString(),
        })),
        whitePlayer: {
          id: game.whitePlayer?.id ?? '',
          displayName: game.whitePlayer?.displayName ?? 'Anonymous White',
          avatarUrl: game.whitePlayer?.avatarUrl ?? null,
          rating: game.whitePlayer?.rating ?? 1500,
          isOnline: true,
        },
        blackPlayer: {
          id: game.blackPlayer?.id ?? '',
          displayName: game.blackPlayer?.displayName ?? (game.blackPlayerId ? 'Qora o\'yinchi' : 'Kutilmoqda...'),
          avatarUrl: game.blackPlayer?.avatarUrl ?? null,
          rating: game.blackPlayer?.rating ?? 1500,
          isOnline: Boolean(game.blackPlayerId),
        },
      };

      // If both players are in the game, broadcast to the room so both screens sync
      if (game.whitePlayerId && game.blackPlayerId) {
        io.to(`game:${gameId}`).emit(SocketEvents.GAME_STATE, statePayload);
      } else {
        socket.emit(SocketEvents.GAME_STATE, statePayload);
      }
    } catch (err: any) {
      socket.emit(SocketEvents.ERROR, {
        code: 'GAME_JOIN_FAILED',
        message: err.message || 'Failed to join game room',
      });
    }
  });

  // Handle player making a move
  socket.on(SocketEvents.GAME_MOVE, async (payload: GameMovePayload) => {
    try {
      const { gameId, from, to, sequence } = payload;
      const result = await GameService.processMove(gameId, user.id, {
        from,
        to,
        sequence,
      });

      const res = result as any;

      // Broadcast move to all participants in game room
      io.to(`game:${gameId}`).emit(SocketEvents.GAME_MOVE_ACCEPTED, {
        gameId,
        move: {
          ...res.move,
          from: res.move.from as any,
          to: res.move.to as any,
          captures: res.move.captures as any,
          timestamp: res.move.timestamp.toISOString(),
        },
        nextTurn: res.nextTurn,
        whiteTimeLeftMs: 180000,
        blackTimeLeftMs: 180000,
      });

      // If bot move was also performed
      if (res.botMove) {
        const botM = res.botMove;
        io.to(`game:${gameId}`).emit(SocketEvents.GAME_MOVE_ACCEPTED, {
          gameId,
          move: {
            ...botM,
            from: botM.from as any,
            to: botM.to as any,
            captures: botM.captures as any,
            timestamp: botM.timestamp.toISOString(),
          },
          nextTurn: res.game.currentTurn,
          whiteTimeLeftMs: 180000,
          blackTimeLeftMs: 180000,
        });
      }

      // If game has concluded
      if (res.game.status === 'FINISHED') {
        io.to(`game:${gameId}`).emit(SocketEvents.GAME_FINISHED, {
          gameId,
          result: res.game.result,
          reason: res.game.resultReason,
          winnerId: res.game.winnerId,
          ratingUpdates: res.game.ratingUpdates || [],
        });
      }
    } catch (err: any) {
      socket.emit(SocketEvents.GAME_MOVE_REJECTED, {
        gameId: payload.gameId,
        reason: err.message || 'Illegal or rejected move',
      });
    }
  });

  // Handle player resigning
  socket.on(SocketEvents.GAME_RESIGN, async (payload: GameResignPayload) => {
    try {
      const finished = await GameService.handleResign(payload.gameId, user.id);
      io.to(`game:${payload.gameId}`).emit(SocketEvents.GAME_FINISHED, {
        gameId: payload.gameId,
        result: finished.result!,
        reason: finished.resultReason!,
        winnerId: finished.winnerId,
        ratingUpdates: finished.ratingUpdates || [],
      });
    } catch (err: any) {
      socket.emit(SocketEvents.ERROR, {
        code: 'RESIGN_FAILED',
        message: err.message,
      });
    }
  });

  // Handle draw offer
  socket.on(SocketEvents.GAME_DRAW_OFFER, async (payload: GameDrawOfferPayload) => {
    try {
      const { drawOfferedBy } = await GameService.handleDrawOffer(payload.gameId, user.id);
      socket.to(`game:${payload.gameId}`).emit(SocketEvents.GAME_DRAW_OFFERED, {
        gameId: payload.gameId,
        offeredByColor: drawOfferedBy,
      });
    } catch (err: any) {
      socket.emit(SocketEvents.ERROR, {
        code: 'DRAW_OFFER_FAILED',
        message: err.message,
      });
    }
  });

  // Handle draw accept
  socket.on(SocketEvents.GAME_DRAW_ACCEPT, async (payload: GameDrawAcceptPayload) => {
    try {
      const finished = await GameService.handleDrawAccept(payload.gameId, user.id);
      io.to(`game:${payload.gameId}`).emit(SocketEvents.GAME_FINISHED, {
        gameId: payload.gameId,
        result: finished.result!,
        reason: finished.resultReason!,
        winnerId: null,
        ratingUpdates: finished.ratingUpdates || [],
      });
    } catch (err: any) {
      socket.emit(SocketEvents.ERROR, {
        code: 'DRAW_ACCEPT_FAILED',
        message: err.message,
      });
    }
  });

  // Handle draw decline
  socket.on(SocketEvents.GAME_DRAW_DECLINE, (payload: GameDrawDeclinePayload) => {
    socket.to(`game:${payload.gameId}`).emit(SocketEvents.GAME_DRAW_DECLINED, {
      gameId: payload.gameId,
      declinedByColor: PlayerColor.WHITE,
    });
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    const gameId = socket.data.currentGameId;
    if (gameId) {
      socket.to(`game:${gameId}`).emit(SocketEvents.GAME_OPPONENT_DISCONNECTED, {
        gameId,
        disconnectedColor: PlayerColor.WHITE,
        gracePeriodSeconds: 30,
      });

      MatchmakingService.handleDisconnect(
        user.id,
        gameId,
        30,
        (_abandonedId, gId) => {
          io.to(`game:${gId}`).emit(SocketEvents.GAME_FINISHED, {
            gameId: gId,
            result: 'BLACK_WON',
            reason: 'DISCONNECTION',
            winnerId: null,
          });
        },
      );
    }
  });
}
