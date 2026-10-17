import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerColor } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Board } from '../components/game/Board';
import { PlayerInfo } from '../components/game/PlayerInfo';
import { TurnIndicator } from '../components/game/TurnIndicator';
import { MoveHistory } from '../components/game/MoveHistory';
import { GameControls } from '../components/game/GameControls';
import { GameResultModal } from '../components/game/GameResult';
import { Button } from '../components/ui/Button';
import { useGameStore, BotDifficulty } from '../stores/game';
import { useAuth } from '../hooks/useAuth';
import { triggerHaptic } from '../utils/telegram';
import { Bot, User, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import { cn } from '../utils/cn';

export const BotGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('medium');

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
    isBotThinking,
    isSubmittingMove,
    whiteTimeLeftMs,
    blackTimeLeftMs,
    tickTimer,
    initNewBotGame,
    selectSquare,
    executeMove,
    resignGame,
    offerDrawOffline,
  } = useGameStore();

  useEffect(() => {
    initNewBotGame(selectedDifficulty);
  }, []);

  // Continuous active countdown timer for current turn
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, tickTimer]);

  const handleDifficultyChange = (diff: BotDifficulty) => {
    triggerHaptic('selection');
    setSelectedDifficulty(diff);
    initNewBotGame(diff);
  };

  const hasMandatoryCapture = legalMoves.some((m) => Boolean(m.captures && m.captures.length > 0));

  const getBotRating = () => {
    if (selectedDifficulty === 'easy') return 800;
    if (selectedDifficulty === 'medium') return 1300;
    return 1800;
  };

  const getDiffLabel = (diff: BotDifficulty) => {
    if (diff === 'easy') return language === 'ru' ? 'Легкий' : language === 'en' ? 'Easy' : 'Oson';
    if (diff === 'medium') return language === 'ru' ? 'Средний' : language === 'en' ? 'Medium' : "O'rta";
    return language === 'ru' ? 'Сложный' : language === 'en' ? 'Hard' : 'Qiyin';
  };

  const getBotName = () => {
    const diffStr =
      selectedDifficulty === 'easy'
        ? language === 'ru' ? 'Легкий' : language === 'en' ? 'Easy' : 'Oson'
        : selectedDifficulty === 'medium'
          ? language === 'ru' ? 'Средний' : language === 'en' ? 'Medium' : "O'rta"
          : language === 'ru' ? 'Гроссмейстер' : language === 'en' ? 'Grandmaster' : 'Grossmeyster';
    return `Bot (${diffStr})`;
  };

  return (
    <PageContainer
      headerProps={{
        title: language === 'ru' ? 'Игра против бота' : language === 'en' ? 'Practice vs Bot' : "Botga qarshi o'yin",
        showBack: true,
        onBack: () => navigate('/'),
      }}
      showBottomNav={false}
    >
      <div className="flex flex-col gap-3">
        {/* Difficulty Selection Pills */}
        <div className="flex items-center justify-between p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all select-none',
                selectedDifficulty === diff
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200',
              )}
            >
              {getDiffLabel(diff)}
            </button>
          ))}
        </div>

        {/* Bot Opponent Info (Top) */}
        <PlayerInfo
          displayName={getBotName()}
          color={PlayerColor.BLACK}
          rating={getBotRating()}
          timeLeftMs={blackTimeLeftMs}
          isCurrentTurn={currentTurn === PlayerColor.BLACK}
          isOnline={true}
        />

        {/* Turn Status Alert */}
        <TurnIndicator
          currentTurn={currentTurn}
          hasMandatoryCapture={hasMandatoryCapture && currentTurn === PlayerColor.WHITE}
          isBotThinking={isBotThinking}
        />

        {/* Checkers Board */}
        <Board
          board={board}
          currentTurn={currentTurn}
          legalMoves={legalMoves}
          selectedCoordinate={selectedCoordinate}
          lastMove={lastMove}
          orientation={PlayerColor.WHITE}
          isInteractive={!isBotThinking && currentTurn === PlayerColor.WHITE}
          isSubmittingMove={isSubmittingMove}
          onSelectPiece={selectSquare}
          onMakeMove={executeMove}
        />

        {/* Human Player Info (Bottom) */}
        <PlayerInfo
          displayName={user?.displayName || 'Siz'}
          avatarUrl={user?.avatarUrl}
          color={PlayerColor.WHITE}
          timeLeftMs={whiteTimeLeftMs}
          isCurrentTurn={currentTurn === PlayerColor.WHITE}
        />

        {/* Move History */}
        <MoveHistory moves={moveHistory} />

        {/* Controls */}
        <GameControls
          onResign={() => resignGame(PlayerColor.WHITE)}
          onOfferDraw={offerDrawOffline}
          onResetGame={() => initNewBotGame(selectedDifficulty)}
        />
      </div>

      {/* Game Over Modal */}
      <GameResultModal
        isOpen={isGameOver}
        result={gameResult}
        reason={resultReason}
        myColor={PlayerColor.WHITE}
        onPlayAgain={() => initNewBotGame(selectedDifficulty)}
        onExit={() => navigate('/')}
      />
    </PageContainer>
  );
};
