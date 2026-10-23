import { apiClient, setApiAuthToken } from './client';
import type {
  TelegramAuthRequest,
  TelegramAuthResponse,
  AuthSessionResponse,
} from '@shashka/shared-types';

export const authApi = {
  loginWithTelegram: async (initData: string): Promise<TelegramAuthResponse> => {
    const payload: TelegramAuthRequest = { initData };
    const response = await apiClient<TelegramAuthResponse>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (response.token) {
      setApiAuthToken(response.token);
    }
    return response;
  },

  getCurrentSession: async (): Promise<AuthSessionResponse> => {
    return apiClient<AuthSessionResponse>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient<void>('/auth/logout', { method: 'POST' });
    } finally {
      setApiAuthToken(null);
    }
  },

  setCredentials: async (credentials: { username: string; password: string }): Promise<{ success: boolean; message: string }> => {
    return apiClient('/auth/set-credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  loginWithCredentials: async (credentials: { username: string; password: string }): Promise<TelegramAuthResponse> => {
    const response = await apiClient<TelegramAuthResponse>('/auth/login-credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.token) {
      setApiAuthToken(response.token);
    }
    return response;
  },
};
