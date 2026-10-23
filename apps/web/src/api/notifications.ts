import { apiClient } from './client';

export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (): Promise<NotificationModel[]> => {
    return apiClient<NotificationModel[]>('/notifications');
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  broadcastNotification: async (data: {
    title: string;
    message: string;
    type?: string;
  }): Promise<{ success: boolean; count: number }> => {
    return apiClient<{ success: boolean; count: number }>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
