import { apiClient } from './client';
import type {
  GameDetailsResponse,
  CreateGameRequest,
  CreateGameResponse,
  GameListQuery,
  PaginatedResponse,
  GameModel,
} from '@shashka/shared-types';

export const gamesApi = {
  getGameDetails: async (gameId: string): Promise<GameDetailsResponse> => {
    return apiClient<GameDetailsResponse>(`/games/${gameId}`);
  },

  createGame: async (data: CreateGameRequest): Promise<CreateGameResponse> => {
    return apiClient<CreateGameResponse>('/games', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listGames: async (query?: GameListQuery): Promise<PaginatedResponse<GameModel>> => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.userId) params.set('userId', query.userId);
    if (query?.status) params.set('status', query.status);
    if (query?.mode) params.set('mode', query.mode);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient<PaginatedResponse<GameModel>>(`/games${queryString}`);
  },

  getMyGames: async (query?: GameListQuery): Promise<PaginatedResponse<GameModel>> => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.status) params.set('status', query.status);
    if (query?.mode) params.set('mode', query.mode);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient<PaginatedResponse<GameModel>>(`/games/my${queryString}`);
  },

  createInviteGame: async (mode = 'CLASSIC'): Promise<{ success: boolean; data: any }> => {
    return apiClient<{ success: boolean; data: any }>('/games/invite', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },

  joinGame: async (gameId: string): Promise<{ success: boolean; data: any }> => {
    return apiClient<{ success: boolean; data: any }>(`/games/${gameId}/join`, {
      method: 'POST',
    });
  },

  recordCompletedGame: async (data: {
    userId?: string;
    mode: string;
    difficulty?: string;
    result: string;
    reason: string;
    moves?: any[];
  }): Promise<{ success: boolean; data: any }> => {
    return apiClient<{ success: boolean; data: any }>('/games/record-completed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFeaturedWeekly: async (): Promise<any[]> => {
    return apiClient<any[]>('/games/featured-weekly');
  },

  rateGame: async (
    gameId: string,
    rating: number,
    comment?: string,
  ): Promise<{ success: boolean; data: any }> => {
    return apiClient<{ success: boolean; data: any }>(`/games/${gameId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },
};
