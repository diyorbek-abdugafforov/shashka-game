import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerColor, GameMode } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Board } from '../components/game/Board';
import { PlayerInfo } from '../components/game/PlayerInfo';
import { TurnIndicator } from '../components/game/TurnIndicator';
import { MoveHistory } from '../components/game/MoveHistory';
import { GameControls } from '../components/game/GameControls';
import { GameResultModal } from '../components/game/GameResult';
import { Card } from '../components/ui/Card';
import { useGameStore } from '../stores/game';
import { useSettingsStore } from '../stores/settings';
import { RotateCw, Trophy, Users } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { cn } from '../utils/cn';

export const OfflineGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { autoRotateBoard, toggleAutoRotate } = useSettingsStore();

  const [manualOrientation, setManualOrientation] = useState<PlayerColor>(PlayerColor.WHITE);

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
    isSubmittingMove,
    offlineScores,
    whiteTimeLeftMs,
    blackTimeLeftMs,
    tickTimer,
    initNewOfflineGame,
    selectSquare,
    executeMove,
    resignGame,
    offerDrawOffline,
    resetScores,
  } = useGameStore();

  useEffect(() => {
    initNewOfflineGame(GameMode.CLASSIC);
  }, []);

  // Continuous active countdown timer for current turn
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, tickTimer]);

  const boardOrientation = autoRotateBoard ? currentTurn : manualOrientation;

  const handleToggleManualOrientation = () => {
    triggerHaptic('light');
    setManualOrientation((prev) =>
      prev === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE,
    );
  };

  const hasMandatoryCapture = legalMoves.some((m) => Boolean(m.captures && m.captures.length > 0));

  const topColor = boardOrientation === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
  const bottomColor = boardOrientation === PlayerColor.WHITE ? PlayerColor.WHITE : PlayerColor.BLACK;
  const topTime = topColor === PlayerColor.WHITE ? whiteTimeLeftMs : blackTimeLeftMs;
  const bottomTime = bottomColor === PlayerColor.WHITE ? whiteTimeLeftMs : blackTimeLeftMs;

  return (
    <PageContainer
      headerProps={{
        title: 'Ikki o\'yinchi (Pass & Play)',
        showBack: true,
        onBack: () => navigate('/'),
      }}
      showBottomNav={false}
    >
      <div className="flex flex-col gap-3">
        {/* Score Board Header */}
        <Card className="flex items-center justify-around p-2.5 bg-zinc-900 border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-stone-200 border border-stone-400" />
            <span className="font-semibold text-zinc-200">Oqlar: {offlineScores.white}</span>
          </div>
          <span className="text-zinc-500 font-mono">Durang: {offlineScores.draws}</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600" />
            <span className="font-semibold text-zinc-200">Qoralar: {offlineScores.black}</span>
          </div>
        </Card>

        {/* Top Player (Black or White based on orientation) */}
        <PlayerInfo
          displayName={boardOrientation === PlayerColor.WHITE ? '2-O\'yinchi (Qora)' : '1-O\'yinchi (Oq)'}
          color={topColor}
          timeLeftMs={topTime}
          isCurrentTurn={currentTurn === topColor}
        />

        {/* Turn Status Alert */}
        <TurnIndicator
          currentTurn={currentTurn}
          hasMandatoryCapture={hasMandatoryCapture}
        />

        {/* Checkers Board */}
        <Board
          board={board}
          currentTurn={currentTurn}
          legalMoves={legalMoves}
          selectedCoordinate={selectedCoordinate}
          lastMove={lastMove}
          orientation={boardOrientation}
          isInteractive={true}
          isSubmittingMove={isSubmittingMove}
          onSelectPiece={selectSquare}
          onMakeMove={executeMove}
        />

        {/* Bottom Player */}
        <PlayerInfo
          displayName={boardOrientation === PlayerColor.WHITE ? '1-O\'yinchi (Oq)' : '2-O\'yinchi (Qora)'}
          color={bottomColor}
          timeLeftMs={bottomTime}
          isCurrentTurn={currentTurn === bottomColor}
        />

        {/* Move History */}
        <MoveHistory moves={moveHistory} />

        {/* Controls */}
        <GameControls
          onRotateBoard={handleToggleManualOrientation}
          onResign={() => resignGame(currentTurn)}
          onOfferDraw={offerDrawOffline}
          onResetGame={() => initNewOfflineGame(GameMode.CLASSIC)}
        />
      </div>

      {/* Game Over Modal */}
      <GameResultModal
        isOpen={isGameOver}
        result={gameResult}
        reason={resultReason}
        myColor={boardOrientation}
        onPlayAgain={() => initNewOfflineGame(GameMode.CLASSIC)}
        onExit={() => navigate('/')}
      />
    </PageContainer>
  );
};
