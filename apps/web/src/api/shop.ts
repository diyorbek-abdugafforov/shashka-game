import { apiClient } from './client';
import type {
  ShopItemModel,
  UserInventoryResponse,
  PurchaseShopItemRequest,
  EquipItemRequest,
} from '@shashka/shared-types';

export const shopApi = {
  getItems: async (): Promise<ShopItemModel[]> => {
    return apiClient<ShopItemModel[]>('/shop/items');
  },

  getInventory: async (): Promise<UserInventoryResponse> => {
    return apiClient<UserInventoryResponse>('/shop/inventory');
  },

  purchaseItem: async (itemId: string): Promise<void> => {
    const payload: PurchaseShopItemRequest = { itemId };
    return apiClient<void>('/shop/purchase', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  equipItem: async (userInventoryId: string): Promise<void> => {
    const payload: EquipItemRequest = { userInventoryId };
    return apiClient<void>('/shop/equip', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
