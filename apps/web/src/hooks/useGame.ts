import { useGameStore } from '../stores/game';
import { useSettingsStore } from '../stores/settings';

export function useGame() {
  const gameState = useGameStore();
  const settings = useSettingsStore();

  return {
    ...gameState,
    soundEnabled: settings.soundEnabled,
    animationsEnabled: settings.animationsEnabled,
    autoRotateBoard: settings.autoRotateBoard,
    boardTheme: settings.boardTheme,
  };
}
