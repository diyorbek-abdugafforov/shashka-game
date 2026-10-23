import { apiClient } from './client';
import type {
  UserModel,
  UserStatsResponse,
  UpdateUserProfileRequest,
  RatingHistoryModel,
} from '@shashka/shared-types';

export const usersApi = {
  getProfile: async (userId: string): Promise<UserModel> => {
    return apiClient<UserModel>(`/users/${userId}`);
  },

  getMyProfile: async (): Promise<UserModel> => {
    return apiClient<UserModel>('/users/me');
  },

  getUserStats: async (userId: string): Promise<UserStatsResponse> => {
    return apiClient<UserStatsResponse>(`/users/${userId}/stats`);
  },

  getMyStats: async (): Promise<UserStatsResponse> => {
    return apiClient<UserStatsResponse>('/users/me/stats');
  },

  updateProfile: async (data: UpdateUserProfileRequest): Promise<UserModel> => {
    return apiClient<UserModel>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getRatingHistory: async (userId: string): Promise<RatingHistoryModel[]> => {
    return apiClient<RatingHistoryModel[]>(`/users/${userId}/rating-history`);
  },

  getOnlineUsers: async (): Promise<any[]> => {
    return apiClient<any[]>('/users/online');
  },

  rollDice: async (bet: number): Promise<{
    diceNumber: number;
    multiplier: number;
    bet: number;
    reward: number;
    netProfit: number;
    newBalance: number;
  }> => {
    return apiClient('/users/roll-dice', {
      method: 'POST',
      body: JSON.stringify({ bet }),
    });
  },

  getAllPlayers: async (): Promise<any[]> => {
    return apiClient<any[]>('/users/all-players');
  },
};
