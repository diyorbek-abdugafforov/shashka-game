import { apiClient } from './client';
import { GameMode, type LeaderboardResponse } from '@shashka/shared-types';

export const leaderboardApi = {
  getLeaderboard: async (mode: GameMode = GameMode.CLASSIC, limit: number = 50): Promise<LeaderboardResponse> => {
    const params = new URLSearchParams({
      mode,
      limit: limit.toString(),
    });
    return apiClient<LeaderboardResponse>(`/leaderboard?${params.toString()}`);
  },
};
