import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayerColor, GameResult, ResultReason } from '@shashka/shared-types';
import type { Move as ValidatedMove } from '@shashka/game-engine';
import { PageContainer } from '../components/layout/PageContainer';
import { Board } from '../components/game/Board';
import { PlayerInfo } from '../components/game/PlayerInfo';
import { TurnIndicator } from '../components/game/TurnIndicator';
import { MoveHistory } from '../components/game/MoveHistory';
import { GameControls } from '../components/game/GameControls';
import { GameResultModal } from '../components/game/GameResult';
import { InGameChat } from '../components/game/InGameChat';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { useGameStore } from '../stores/game';
import { useAuth } from '../hooks/useAuth';
import { useSocketContext } from '../providers/SocketProvider';
import { gamesApi } from '../api/games';
import { WifiOff, AlertTriangle, Share2, Copy, Check, Users, Eye, Handshake } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export const OnlineGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const isSpectator = searchParams.get('spectate') === 'true';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const {
    socket,
    isConnected,
    joinGame,
    spectateGame,
    sendMove,
    resignGame: socketResign,
    offerDraw: socketOfferDraw,
    acceptDraw: socketAcceptDraw,
    declineDraw: socketDeclineDraw,
  } = useSocketContext();

  const {
    board,
    currentTurn,
    legalMoves,
    selectedCoordinate,
    lastMove,
    moveHistory,
    isGameOver,
    gameResult,
    resultReason,
    myColor,
    whitePlayer,
    blackPlayer,
    whiteTimeLeftMs,
    blackTimeLeftMs,
    drawOfferedBy,
    isOpponentDisconnected,
    isSubmittingMove,
    selectSquare,
    setOnlineGameState,
    tickTimer,
    clearOnlineGame,
  } = useGameStore();

  // Initial HTTP fetch if socket has not yet sent state
  const { data: initialGameData, isLoading, isError, refetch } = useQuery({
    queryKey: ['game-details', gameId],
    queryFn: () => (gameId ? gamesApi.getGameDetails(gameId) : null),
    enabled: Boolean(gameId) && !whitePlayer,
    staleTime: 5000,
  });

  useEffect(() => {
    if (initialGameData && gameId) {
      setOnlineGameState(
        {
          game: initialGameData.game,
          moves: initialGameData.moves,
          whitePlayer: {
            id: initialGameData.whitePlayer?.id || '',
            displayName: initialGameData.whitePlayer?.displayName || 'Oq o\'yinchi',
            avatarUrl: initialGameData.whitePlayer?.avatarUrl || null,
            rating: (initialGameData.whitePlayer as any)?.rating ?? 0,
            isOnline: true,
          },
          blackPlayer: {
            id: initialGameData.blackPlayer?.id || '',
            displayName: initialGameData.blackPlayer?.displayName || 'Qora o\'yinchi',
            avatarUrl: initialGameData.blackPlayer?.avatarUrl || null,
            rating: (initialGameData.blackPlayer as any)?.rating ?? 0,
            isOnline: true,
          },
        },
        user?.id,
      );
    }
  }, [initialGameData, gameId, user?.id, setOnlineGameState]);

  // Robust fallback for invite links: if HTTP fails, initialize game so players can play via socket
  useEffect(() => {
    if (isError && gameId && !whitePlayer) {
      setOnlineGameState(
        {
          game: {
            id: gameId,
            status: 'WAITING_FOR_PLAYERS',
            boardState: 'W:W21,22,23,24,25,26,27,28,29,30,31,32:B1,2,3,4,5,6,7,8,9,10,11,12',
            currentTurn: PlayerColor.WHITE,
            whitePlayerId: user?.id || 'player1',
            blackPlayerId: null,
            timeControl: { initialSeconds: 180, incrementSeconds: 2 },
            whiteTimeLeftMs: 180000,
            blackTimeLeftMs: 180000,
            startedAt: new Date().toISOString(),
          } as any,
          moves: [],
          whitePlayer: {
            id: user?.id || 'player1',
            displayName: user?.displayName || 'Oq o\'yinchi',
            avatarUrl: user?.avatarUrl || null,
            rating: 0,
            isOnline: true,
          },
          blackPlayer: {
            id: 'player2',
            displayName: 'Raqib (Do\'st)',
            avatarUrl: null,
            rating: 0,
            isOnline: true,
          },
        },
        user?.id,
      );
    }
  }, [isError, gameId, whitePlayer, user, setOnlineGameState]);

  useEffect(() => {
    if (gameId && isConnected) {
      if (isSpectator) {
        spectateGame(gameId);
      } else {
        joinGame(gameId);
      }
    }
  }, [gameId, isConnected, isSpectator, joinGame, spectateGame]);

  useEffect(() => {
    return () => {
      clearOnlineGame();
    };
  }, [clearOnlineGame]);

  // Auto-join invite game if user is not the creator and slot is open
  useEffect(() => {
    if (
      gameId &&
      user?.id &&
      initialGameData?.game &&
      initialGameData.game.status === 'WAITING_FOR_PLAYERS' &&
      initialGameData.game.whitePlayerId !== user.id &&
      !initialGameData.game.blackPlayerId
    ) {
      gamesApi
        .joinGame(gameId)
        .then((res) => {
          if (res?.data) {
            refetch();
          }
        })
        .catch(() => {});
    }
  }, [gameId, user?.id, initialGameData, refetch]);

  // Continuous active countdown timer for online gameplay
  useEffect(() => {
    if (isGameOver || !whitePlayer || !blackPlayer) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, whitePlayer, blackPlayer, tickTimer]);

  const handleShareInvite = async () => {
    const tgUrl = `https://t.me/wikipediyauzrobot?start=game_${gameId}`;
    const webUrl = `${window.location.origin}/#/game/online/${gameId}`;
    const urlToShare = tgUrl || webUrl;

    try {
      await navigator.clipboard.writeText(urlToShare);
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleMakeMove = (move: ValidatedMove) => {
    if (!gameId || isSubmittingMove || !myColor || currentTurn !== myColor) return;
    triggerHaptic('light');
    sendMove(gameId, move.from, move.to);
  };

  const handleResign = () => {
    if (!gameId) return;
    triggerHaptic('warning');
    socketResign(gameId);
  };

  const handleOfferDraw = () => {
    if (!gameId) return;
    socketOfferDraw(gameId);
  };

  const handleAcceptDraw = () => {
    if (!gameId) return;
    socketAcceptDraw(gameId);
  };

  const handleDeclineDraw = () => {
    if (!gameId) return;
    socketDeclineDraw(gameId);
  };

  if (isLoading && !whitePlayer && !board) {
    return (
      <PageContainer headerProps={{ title: 'O\'yin xonasi' }} showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" className="text-indigo-500" />
          <span className="text-xs text-zinc-400">O'yin yuklanmoqda...</span>
        </div>
      </PageContainer>
    );
  }

  if (isError && !whitePlayer && !isConnected) {
    return (
      <PageContainer headerProps={{ title: 'Xatolik', showBack: true }} showBottomNav={false}>
        <div className="py-12">
          <ErrorState
            title="O'yin topilmadi"
            message="Ushbu o'yin mavjud emas yoki muddati tugagan bo'lishi mumkin."
            onRetry={refetch}
          />
        </div>
      </PageContainer>
    );
  }

  const isMyTurn = myColor === currentTurn;
  const orientation = myColor || PlayerColor.WHITE;
  const isWhiteView = orientation === PlayerColor.WHITE;

  const topPlayer = isWhiteView ? blackPlayer : whitePlayer;
  const bottomPlayer = isWhiteView ? whitePlayer : blackPlayer;
  const topColor = isWhiteView ? PlayerColor.BLACK : PlayerColor.WHITE;
  const bottomColor = isWhiteView ? PlayerColor.WHITE : PlayerColor.BLACK;
  const topTime = isWhiteView ? blackTimeLeftMs : whiteTimeLeftMs;
  const bottomTime = isWhiteView ? whiteTimeLeftMs : blackTimeLeftMs;

  const hasMandatoryCapture = legalMoves.some((m) => Boolean(m.captures && m.captures.length > 0));
  const drawOfferedByOpponent = Boolean(drawOfferedBy && drawOfferedBy !== myColor);
  const drawOfferedByMe = Boolean(drawOfferedBy && drawOfferedBy === myColor);

  const wonGame =
    (myColor === PlayerColor.WHITE && gameResult === GameResult.WHITE_WON) ||
    (myColor === PlayerColor.BLACK && gameResult === GameResult.BLACK_WON);

  return (
    <PageContainer
      headerProps={{
        title: isSpectator ? "O'yinni kuzatish" : 'Onlayn bahs',
        showBack: true,
        onBack: () => navigate('/'),
        rightAction: isSpectator ? (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-500/40">
            <Eye className="w-3.5 h-3.5" />
            <span>Kuzatuvchi</span>
          </span>
        ) : undefined,
      }}
      showBottomNav={false}
    >
      <div className="flex flex-col gap-3">
        {/* Spectator Mode Banner */}
        {isSpectator && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-200 text-xs">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Siz ushbu o'yinni jonli kuzatyapsiz. Harakatlar avtomatik yangilanadi.</span>
          </div>
        )}

        {/* Opponent Disconnection Banner */}
        {isOpponentDisconnected && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs animate-pulse">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Raqib bilan aloqa uzildi. Uning qaytishi kutilmoqda...</span>
          </div>
        )}

        {/* My Draw Offer Pending Banner */}
        {drawOfferedByMe && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/70 text-indigo-200 text-xs animate-pulse">
            <Handshake className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Durrang taklif qilindi. Raqibingiz javobi kutilmoqda...</span>
          </div>
        )}

        {/* Waiting for Friend / Opponent to Join */}
        {!isSpectator && (!blackPlayer?.id || initialGameData?.game?.status === 'WAITING_FOR_PLAYERS') && (
          <Card className="p-3.5 bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-zinc-900 border-indigo-700/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Spinner size="sm" className="text-indigo-400" />
                <span>Do'stingiz ulanishi kutilmoqda...</span>
              </div>
              <button
                onClick={handleShareInvite}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Nusxalandi!' : 'Havola ulashish'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Havolani do'stingizga yuboring. U havolani ochishi bilan o'yin ikkala qurilmada avtomatik boshlanadi.
            </p>
          </Card>
        )}

        {/* Top Player (Opponent) */}
        <PlayerInfo
          displayName={topPlayer?.displayName || 'Raqib'}
          avatarUrl={topPlayer?.avatarUrl}
          rating={topPlayer?.rating ?? 0}
          color={topColor}
          timeLeftMs={topTime}
          isCurrentTurn={currentTurn === topColor}
          isOnline={!isOpponentDisconnected}
        />

        {/* Turn Status Alert */}
        <TurnIndicator
          currentTurn={currentTurn}
          hasMandatoryCapture={hasMandatoryCapture && isMyTurn && !isSpectator}
        />

        {/* Checkers Board */}
        <Board
          board={board}
          currentTurn={currentTurn}
          legalMoves={legalMoves}
          selectedCoordinate={selectedCoordinate}
          lastMove={lastMove}
          orientation={orientation}
          isInteractive={!isSpectator && isMyTurn && !isGameOver}
          isSubmittingMove={isSubmittingMove}
          onSelectPiece={selectSquare}
          onMakeMove={handleMakeMove}
        />

        {/* Bottom Player (You) */}
        <PlayerInfo
          displayName={bottomPlayer?.displayName || user?.displayName || 'Siz'}
          avatarUrl={bottomPlayer?.avatarUrl || user?.avatarUrl}
          rating={bottomPlayer?.rating ?? 0}
          color={bottomColor}
          timeLeftMs={bottomTime}
          isCurrentTurn={currentTurn === bottomColor}
          isOnline={true}
        />

        {/* In-Game Chat for both players */}
        {gameId && (
          <div className="flex items-center justify-between py-1">
            <InGameChat gameId={gameId} />
          </div>
        )}

        {/* Move History */}
        <MoveHistory moves={moveHistory} />

        {/* Controls */}
        {!isSpectator && (
          <GameControls
            isOnline={true}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            drawOfferedByOpponent={drawOfferedByOpponent}
            onAcceptDraw={handleAcceptDraw}
            onDeclineDraw={handleDeclineDraw}
          />
        )}
      </div>

      {/* Game Result Modal */}
      <GameResultModal
        isOpen={isGameOver && !isSpectator}
        result={gameResult}
        reason={resultReason}
        myColor={myColor}
        ratingChange={wonGame ? 16 : 0}
        onReviewGame={() => gameId && navigate(`/games/${gameId}`)}
        onPlayAgain={() => navigate('/modes')}
        onExit={() => navigate('/')}
      />
    </PageContainer>
  );
};
