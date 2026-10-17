import { apiClient } from './client';

export interface FriendModel {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  rating: number;
  isOnline: boolean;
  friendshipId: string;
  createdAt: string;
}

export const friendsApi = {
  getFriends: async (): Promise<FriendModel[]> => {
    return apiClient<FriendModel[]>('/friends');
  },

  addFriend: async (friendId: string): Promise<any> => {
    return apiClient<any>('/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  },

  removeFriend: async (friendId: string): Promise<any> => {
    return apiClient<any>(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  },

  checkIsFriend: async (friendId: string): Promise<{ isFriend: boolean }> => {
    return apiClient<{ isFriend: boolean }>(`/friends/check/${friendId}`);
  },
};
