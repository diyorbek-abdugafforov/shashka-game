import { apiClient } from './client';
import type {
  FeatureFlagModel,
  SystemSettingModel,
  ToggleFeatureFlagRequest,
  UpdateSystemSettingRequest,
} from '@shashka/shared-types';

export interface SettingsData {
  settings: SystemSettingModel[];
  featureFlags: FeatureFlagModel[];
  isMaintenanceMode: boolean;
}

export const settingsApi = {
  getSettings: async (): Promise<SettingsData> => {
    try {
      return await apiClient.get<SettingsData>('/admin/settings');
    } catch {
      return getMockSettings();
    }
  },

  updateSetting: async (data: UpdateSystemSettingRequest): Promise<SystemSettingModel> => {
    return await apiClient.put<SystemSettingModel>(`/admin/settings/${data.key}`, data);
  },

  toggleFeatureFlag: async (data: ToggleFeatureFlagRequest): Promise<FeatureFlagModel> => {
    return await apiClient.patch<FeatureFlagModel>(`/admin/settings/flags/${data.key}`, data);
  },

  toggleMaintenanceMode: async (enabled: boolean, message?: string): Promise<{ isMaintenanceMode: boolean }> => {
    return await apiClient.post<{ isMaintenanceMode: boolean }>('/admin/settings/maintenance', {
      enabled,
      message,
    });
  },
};

function getMockSettings(): SettingsData {
  return {
    isMaintenanceMode: false,
    settings: [
      {
        id: 's-1',
        key: 'DEFAULT_INITIAL_RATING',
        value: '1200',
        description: 'Yangi roʻyxatdan oʻtgan oʻyinchining boshlangʻich reytingi',
        updatedAt: '2026-10-01T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 's-2',
        key: 'WIN_REWARD_COINS',
        value: '50',
        description: 'Reytingli oʻyinda gʻalaba qozonganda beriladigan tangalar miqdori',
        updatedAt: '2026-10-05T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 's-3',
        key: 'DAILY_REWARD_COINS',
        value: '100',
        description: 'Kunlik tizimga kirish uchun taqdim etiladigan bonus',
        updatedAt: '2026-10-08T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 's-4',
        key: 'MIN_WITHDRAWAL_AMOUNT',
        value: '5000',
        description: 'Tangalarni yechib olish uchun minimal chegara',
        updatedAt: '2026-10-10T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 's-5',
        key: 'BOT_MATCHMAKING_TIMEOUT_SEC',
        value: '15',
        description: 'Raqib topilmasa bot taklif qilishgacha kutish vaqti (soniya)',
        updatedAt: '2026-10-12T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
    ],
    featureFlags: [
      {
        id: 'f-1',
        key: 'ENABLE_TOURNAMENTS',
        enabled: true,
        description: 'Rasmiy turnirlar va jadval tizimini faollashtirish',
        updatedAt: '2026-10-14T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 'f-2',
        key: 'ENABLE_SHOP_PURCHASES',
        enabled: true,
        description: 'Doʻkondan mavzu va donalar xarid qilish imkoniyati',
        updatedAt: '2026-10-15T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 'f-3',
        key: 'ENABLE_VOICE_CHAT',
        enabled: false,
        description: 'Oʻyinchilar oʻrtasida audio xabar va ovozli suhbat (beta)',
        updatedAt: '2026-10-16T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 'f-4',
        key: 'ENABLE_GIVEAWAY_MODE',
        enabled: true,
        description: 'Poddavki (teskari shashka) rejimini barcha oʻyinchilarga yoqish',
        updatedAt: '2026-10-12T00:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
      {
        id: 'f-5',
        key: 'AUTO_MODERATION_ANTI_CHEAT',
        enabled: true,
        description: 'Glikman tahlili asosida avtomatik shubhali oʻyinchilarni aniqlash',
        updatedAt: '2026-10-16T12:00:00Z',
        updatedBy: 'SUPER_ADMIN',
      },
    ],
  };
}
