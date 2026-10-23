import { apiClient } from './client';

export interface TournamentModel {
  id: string;
  title: string;
  description?: string;
  mode: string;
  status: string;
  prizePool: number;
  maxPlayers: number;
  startTime: string;
  creatorId?: string;
  creator?: {
    id: string;
    displayName: string;
  };
  participantsCount?: number;
  participants?: any[];
  createdAt: string;
}

export const tournamentsApi = {
  listTournaments: async (): Promise<TournamentModel[]> => {
    return apiClient<TournamentModel[]>('/tournaments');
  },

  createTournament: async (data: {
    title: string;
    description?: string;
    mode?: string;
    prizePool?: number;
    maxPlayers?: number;
    startTime?: string;
  }): Promise<{ success: boolean; data: TournamentModel }> => {
    return apiClient<{ success: boolean; data: TournamentModel }>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  joinTournament: async (tournamentId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/tournaments/${tournamentId}/join`, {
      method: 'POST',
    });
  },
};
