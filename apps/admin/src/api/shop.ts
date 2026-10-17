import { apiClient } from './client';
import { ShopItemCategory, type PaginatedResponse, type ShopItemModel } from '@shashka/shared-types';

export interface CreateShopItemInput {
  name: string;
  description: string;
  category: ShopItemCategory;
  price: number;
  imageUrl: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateShopItemInput extends Partial<CreateShopItemInput> {
  id: string;
}

export interface ShopFilterParams {
  category?: ShopItemCategory;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const shopApi = {
  getShopItems: async (params?: ShopFilterParams): Promise<PaginatedResponse<ShopItemModel>> => {
    try {
      return await apiClient.get<PaginatedResponse<ShopItemModel>>('/admin/shop/items', {
        page: params?.page ?? 1,
        limit: params?.limit ?? 12,
        category: params?.category,
        isActive: params?.isActive,
      });
    } catch {
      return getMockShopItems(params);
    }
  },

  createShopItem: async (data: CreateShopItemInput): Promise<ShopItemModel> => {
    return await apiClient.post<ShopItemModel>('/admin/shop/items', data);
  },

  updateShopItem: async (data: UpdateShopItemInput): Promise<ShopItemModel> => {
    const { id, ...body } = data;
    return await apiClient.put<ShopItemModel>(`/admin/shop/items/${id}`, body);
  },

  toggleItemVisibility: async (id: string, isActive: boolean): Promise<ShopItemModel> => {
    return await apiClient.patch<ShopItemModel>(`/admin/shop/items/${id}/visibility`, { isActive });
  },

  deleteShopItem: async (id: string): Promise<{ success: boolean }> => {
    return await apiClient.delete<{ success: boolean }>(`/admin/shop/items/${id}`);
  },
};

function getMockShopItems(params?: ShopFilterParams): PaginatedResponse<ShopItemModel> {
  const mockItems: ShopItemModel[] = [
    {
      id: 'item-1',
      name: 'Klassik Yogʻoch Taxta (Classic Wood)',
      description: 'Eman yogʻochidan ishlangan anʼanaviy rus shashkasi taxtasi dizayni',
      category: 'BOARD_THEME' as any,
      price: 350,
      imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
      isActive: true,
      metadata: { lightSquare: '#E3C185', darkSquare: '#8B5A2B' },
      createdAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'item-2',
      name: 'Oltin va Zangori Taxta (Gold & Cyan)',
      description: 'VIP oʻyinchilar uchun neon effektli maxsus doska',
      category: 'BOARD_THEME' as any,
      price: 750,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
      isActive: true,
      metadata: { lightSquare: '#FEF08A', darkSquare: '#0369A1' },
      createdAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'item-3',
      name: 'Marmar Donalar (Marble Pieces)',
      description: 'Tabiiy oq va qora marmardan yoʻnilgan nafis shashka toshlari',
      category: 'PIECE_SKIN' as any,
      price: 500,
      imageUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=400',
      isActive: true,
      metadata: { whiteColor: '#F5F5F4', blackColor: '#18181B' },
      createdAt: '2026-02-10T00:00:00Z',
    },
    {
      id: 'item-4',
      name: 'Chempion Ramkasi (Champion Frame)',
      description: 'Profil avatari uchun oltin toj va dafna gulchambari ramkasi',
      category: 'AVATAR_FRAME' as any,
      price: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400',
      isActive: true,
      metadata: { rarity: 'LEGENDARY' },
      createdAt: '2026-03-01T00:00:00Z',
    },
    {
      id: 'item-5',
      name: 'Shashka Ustasi (Grandmaster Title)',
      description: 'Reyting roʻyxati va oʻyinda koʻrinadigan faxriy unvon',
      category: 'TITLE' as any,
      price: 2000,
      imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400',
      isActive: false,
      metadata: { titleText: 'Grossmeyster' },
      createdAt: '2026-03-15T00:00:00Z',
    },
  ];

  let filtered = mockItems;
  if (params?.category) {
    filtered = filtered.filter((i) => i.category === params.category);
  }
  if (params?.isActive !== undefined) {
    filtered = filtered.filter((i) => i.isActive === params.isActive);
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 12;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items = filtered.slice((page - 1) * limit, page * limit);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
