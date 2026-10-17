import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../types.js';
import {
  SocketEvents,
  GameMode,
  PlayerColor,
  type QueueJoinPayload,
  type QueueLeavePayload,
} from '@shashka/shared-types';
import { MatchmakingService } from '../services/matchmaking.service.js';

export function registerMatchmakingHandlers(io: Server, socket: AuthenticatedSocket) {
  const user = socket.data.user;

  // Handle client joining queue
  socket.on(SocketEvents.QUEUE_JOIN, async (payload: QueueJoinPayload) => {
    try {
      const mode = payload.mode || GameMode.CLASSIC;
      const rated = payload.rated !== false;

      const result = await MatchmakingService.joinQueue(user.id, mode, rated);

      socket.emit(SocketEvents.QUEUE_JOINED, {
        mode,
        positionInQueue: result.position,
      });

      // If a match was found immediately
      if (result.match) {
        const { game, player1Id, player2Id } = result.match;

        const p1SocketRoom = `user:${player1Id}`;
        const p2SocketRoom = `user:${player2Id}`;

        const isP1White = game.whitePlayerId === player1Id;

        // Notify Player 1
        io.to(p1SocketRoom).emit(SocketEvents.MATCH_FOUND, {
          gameId: game.id,
          opponent: {
            id: game.blackPlayerId,
            displayName: 'Opponent',
            avatarUrl: null,
            rating: 1500,
          },
          color: isP1White ? PlayerColor.WHITE : PlayerColor.BLACK,
          mode: game.mode,
          timeControl: (game.config as any)?.timeControl || {
            initialSeconds: 180,
            incrementSeconds: 2,
          },
        });

        // Notify Player 2
        io.to(p2SocketRoom).emit(SocketEvents.MATCH_FOUND, {
          gameId: game.id,
          opponent: {
            id: game.whitePlayerId,
            displayName: 'Opponent',
            avatarUrl: null,
            rating: 1500,
          },
          color: isP1White ? PlayerColor.BLACK : PlayerColor.WHITE,
          mode: game.mode,
          timeControl: (game.config as any)?.timeControl || {
            initialSeconds: 180,
            incrementSeconds: 2,
          },
        });
      }
    } catch (err: any) {
      socket.emit(SocketEvents.ERROR, {
        code: 'QUEUE_JOIN_FAILED',
        message: err.message || 'Failed to join queue',
      });
    }
  });

  // Handle client leaving queue
  socket.on(SocketEvents.QUEUE_LEAVE, async (payload: QueueLeavePayload) => {
    try {
      const mode = payload.mode || GameMode.CLASSIC;
      await MatchmakingService.leaveQueue(user.id, mode);
      socket.emit(SocketEvents.QUEUE_LEFT);
    } catch (err: any) {
      socket.emit(SocketEvents.ERROR, {
        code: 'QUEUE_LEAVE_FAILED',
        message: err.message || 'Failed to leave queue',
      });
    }
  });
}
