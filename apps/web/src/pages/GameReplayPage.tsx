import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlayerColor,
  PieceType,
  type BoardMatrix,
} from '@shashka/shared-types';
import { createInitialBoard, cloneBoard } from '@shashka/game-engine';
import { PageContainer } from '../components/layout/PageContainer';
import { Board } from '../components/game/Board';
import { PlayerInfo } from '../components/game/PlayerInfo';
import { MoveHistory } from '../components/game/MoveHistory';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { gamesApi } from '../api/games';
import { getGameResultLabel, getResultReasonLabel } from '../utils/format';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export const GameReplayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['game-replay', gameId],
    queryFn: () => (gameId ? gamesApi.getGameDetails(gameId) : null),
    enabled: Boolean(gameId),
  });

  const moves = data?.moves || [];
  const game = data?.game;
  const whitePlayer = data?.whitePlayer;
  const blackPlayer = data?.blackPlayer;

  // Build the board state at the currentStep
  const boardAtCurrentStep = useMemo<any>(() => {
    let board = createInitialBoard();
    if (moves.length === 0 || currentStep === 0) return board;

    for (let i = 0; i < currentStep && i < moves.length; i++) {
      const m = moves[i]!;
      const newBoard = cloneBoard(board);
      const piece = newBoard[m.from.row]?.[m.from.col];

      newBoard[m.from.row]![m.from.col] = null;
      for (const cap of m.captures) {
        newBoard[cap.row]![cap.col] = null;
      }

      const isKing = piece?.type === PieceType.KING || m.isPromotion;
      newBoard[m.to.row]![m.to.col] = {
        player: m.player as any,
        color: m.player,
        type: isKing ? PieceType.KING : PieceType.MAN,
        position: { row: m.to.row, col: m.to.col },
      } as any;

      board = newBoard;
    }

    return board;
  }, [moves, currentStep]);

  // Set initial step to end of game once loaded
  useEffect(() => {
    if (moves.length > 0) {
      setCurrentStep(moves.length);
    }
  }, [moves.length]);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= moves.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, moves.length]);

  const handleStepChange = (newStep: number) => {
    triggerHaptic('light');
    setIsPlaying(false);
    setCurrentStep(Math.max(0, Math.min(moves.length, newStep)));
  };

  const togglePlay = () => {
    triggerHaptic('selection');
    if (currentStep >= moves.length) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  if (isLoading) {
    return (
      <PageContainer headerProps={{ title: 'O\'yin takrori' }} showBottomNav={false}>
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" className="text-indigo-500" />
          <span className="text-xs text-zinc-400">O'yin yuklanmoqda...</span>
        </div>
      </PageContainer>
    );
  }

  if (isError || !game) {
    return (
      <PageContainer headerProps={{ title: 'Xatolik', showBack: true }} showBottomNav={false}>
        <div className="py-12">
          <ErrorState
            title="O'yin topilmadi"
            message="Ushbu o'yin ma'lumotlarini yuklab bo'lmadi."
            onRetry={refetch}
          />
        </div>
      </PageContainer>
    );
  }

  const resultInfo = getGameResultLabel(game.result);
  const reasonText = getResultReasonLabel(game.resultReason);

  const lastMoveAtStep =
    currentStep > 0 && currentStep <= moves.length
      ? {
          from: moves[currentStep - 1]!.from,
          to: moves[currentStep - 1]!.to,
        }
      : null;

  const currentTurn = currentStep % 2 === 0 ? PlayerColor.WHITE : PlayerColor.BLACK;

  return (
    <PageContainer
      headerProps={{
        title: 'O\'yin takrori',
        showBack: true,
        onBack: () => navigate(-1),
      }}
      showBottomNav={false}
    >
      <div className="flex flex-col gap-3">
        {/* Game summary header */}
        <Card className="p-3 bg-zinc-900/60 border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-zinc-100">{resultInfo.title}</span>
            {reasonText && <span className="text-zinc-400 ml-1">· {reasonText}</span>}
          </div>
          <span className="font-mono text-zinc-400">
            {currentStep} / {moves.length} yurish
          </span>
        </Card>

        {/* Black Player */}
        <PlayerInfo
          displayName={blackPlayer?.displayName || 'Qora o\'yinchi'}
          avatarUrl={blackPlayer?.avatarUrl}
          color={PlayerColor.BLACK}
          isCurrentTurn={currentTurn === PlayerColor.BLACK}
        />

        {/* Board */}
        <Board
          board={boardAtCurrentStep}
          currentTurn={currentTurn}
          legalMoves={[]}
          selectedCoordinate={null}
          lastMove={lastMoveAtStep}
          orientation={PlayerColor.WHITE}
          isInteractive={false}
          onSelectPiece={() => {}}
          onMakeMove={() => {}}
        />

        {/* White Player */}
        <PlayerInfo
          displayName={whitePlayer?.displayName || 'Oq o\'yinchi'}
          avatarUrl={whitePlayer?.avatarUrl}
          color={PlayerColor.WHITE}
          isCurrentTurn={currentTurn === PlayerColor.WHITE}
        />

        {/* Move History Strip with tap to step */}
        <MoveHistory
          moves={moves.map((m) => ({
            from: m.from,
            to: m.to,
            captures: m.captures,
            isPromotion: m.isPromotion,
            notation: m.notation,
          }))}
          currentMoveIndex={currentStep > 0 ? currentStep - 1 : undefined}
          onSelectMove={(idx) => handleStepChange(idx + 1)}
        />

        {/* Replay Controls */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-900 border border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentStep === 0}
            onClick={() => handleStepChange(0)}
            aria-label="Boshiga"
          >
            <ChevronsLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentStep === 0}
            onClick={() => handleStepChange(currentStep - 1)}
            aria-label="Oldingi yurish"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={togglePlay}
            className="w-12 h-10"
            aria-label={isPlaying ? 'Pauza' : 'Ijro'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentStep >= moves.length}
            onClick={() => handleStepChange(currentStep + 1)}
            aria-label="Keyingi yurish"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentStep >= moves.length}
            onClick={() => handleStepChange(moves.length)}
            aria-label="Oxiriga"
          >
            <ChevronsRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
