import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi, type CreateShopItemInput } from '@/api/shop';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShopItemCategory, type ShopItemModel } from '@shashka/shared-types';
import { formatCoins } from '@/utils/format';
import { Plus, Edit2, Eye, EyeOff, ShoppingBag, Trash2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export const ShopPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { canPerformAction } = useAuthStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<ShopItemModel | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateShopItemInput>({
    name: '',
    description: '',
    category: ShopItemCategory.BOARD_THEME,
    price: 100,
    imageUrl: '',
    isActive: true,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'shop', categoryFilter],
    queryFn: () =>
      shopApi.getShopItems({
        category: categoryFilter !== 'ALL' ? (categoryFilter as ShopItemCategory) : undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      shopApi.toggleItemVisibility(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'shop'] }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateShopItemInput) => {
      if (editingItem) {
        return shopApi.updateShopItem({ id: editingItem.id, ...data });
      }
      return shopApi.createShopItem(data);
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setEditingItem(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shopApi.deleteShopItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'shop'] }),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: ShopItemCategory.BOARD_THEME,
      price: 100,
      imageUrl: '',
      isActive: true,
    });
  };

  const handleOpenEdit = (item: ShopItemModel) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
    });
    setIsCreateModalOpen(true);
  };

  const getCategoryLabel = (cat: ShopItemCategory) => {
    switch (cat) {
      case 'BOARD_THEME':
        return 'Taxta dizayni';
      case 'PIECE_SKIN':
        return 'Dona toshlari';
      case 'AVATAR_FRAME':
        return 'Avatar ramkasi';
      case 'EMOJI_PACK':
        return 'Emojilar toʻplami';
      case 'TITLE':
        return 'Faxriy Unvon';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Doʻkon Mahsulotlari Boshqaruvi</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Oʻyin taxtalari, shashka toshlari, ramkalar va unvonlar katalogi
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Yangilash
          </Button>

          {canPerformAction('edit_shop') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetForm();
                setEditingItem(null);
                setIsCreateModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Yangi mahsulot
            </Button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: 'Barcha toifalar' },
          { id: ShopItemCategory.BOARD_THEME, label: 'Taxta dizaynlari' },
          { id: ShopItemCategory.PIECE_SKIN, label: 'Dona toshlari' },
          { id: ShopItemCategory.AVATAR_FRAME, label: 'Avatar ramkalari' },
          { id: ShopItemCategory.TITLE, label: 'Unvonlar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === tab.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      {isLoading ? (
        <LoadingSpinner text="Doʻkon mahsulotlari yuklanmoqda..." />
      ) : !data?.items || data.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6 text-zinc-500" />}
          title="Mahsulotlar topilmadi"
          description="Ushbu toifada hali mahsulotlar yaratilmagan"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              {/* Image banner */}
              <div className="relative h-44 bg-zinc-950 overflow-hidden group">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="purple" size="sm">
                    {getCategoryLabel(item.category)}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant={item.isActive ? 'success' : 'default'} size="sm" dot>
                    {item.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">{item.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="font-bold font-mono text-amber-400 text-base">
                    {formatCoins(item.price)}
                  </span>

                  {canPerformAction('edit_shop') && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        title={item.isActive ? 'Yashirish' : 'Faollashtirish'}
                        onClick={() =>
                          toggleMutation.mutate({ id: item.id, isActive: !item.isActive })
                        }
                      >
                        {item.isActive ? (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        title="Tahrirlash"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        title="Oʻchirish"
                        onClick={() => {
                          if (confirm('Ushbu mahsulotni oʻchirishni tasdiqlaysizmi?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingItem ? 'Mahsulotni tahrirlash' : 'Yangi doʻkon mahsuloti'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate(formData)}
              isLoading={saveMutation.isPending}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Mahsulot nomi"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Masalan: Klassik Yogʻoch Taxta"
            required
          />

          <Select
            label="Kategoriya"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as ShopItemCategory })
            }
            options={[
              { value: ShopItemCategory.BOARD_THEME, label: 'Taxta dizayni (Board Theme)' },
              { value: ShopItemCategory.PIECE_SKIN, label: 'Dona toshlari (Piece Skin)' },
              { value: ShopItemCategory.AVATAR_FRAME, label: 'Avatar ramkasi (Avatar Frame)' },
              { value: ShopItemCategory.TITLE, label: 'Unvon (Title)' },
            ]}
          />

          <Input
            label="Narxi (tangada)"
            type="number"
            min="1"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
            required
          />

          <Input
            label="Rasm URL manzili"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">Tavsif</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Mahsulot haqida qisqacha maʼlumot..."
              className="w-full bg-zinc-950 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
