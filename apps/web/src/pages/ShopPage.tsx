import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShopItemCategory, ShopItemModel } from '@shashka/shared-types';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { shopApi } from '../api/shop';
import { useAuth } from '../hooks/useAuth';
import { formatNumber } from '../utils/format';
import { triggerHaptic } from '../utils/telegram';
import {
  ShoppingBag,
  Coins,
  Palette,
  CircleDot,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react';
import { cn } from '../utils/cn';

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ShopItemCategory>(
    ShopItemCategory.BOARD_THEME,
  );

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => shopApi.getItems(),
    staleTime: 60000,
  });

  const fallbackItems: ShopItemModel[] = [
    {
      id: 'board-royal',
      name: 'Qirollik Yog\'ochi',
      description: 'Noyob eman daraxtidan yasalgan oliy darajali shashka doskasi',
      category: ShopItemCategory.BOARD_THEME,
      price: 1500,
      imageUrl: '',
      isActive: true,
      metadata: { darkColor: '#5c3317', lightColor: '#d2b48c' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'board-emerald-luxury',
      name: 'Zumrad Hashamati',
      description: 'Yashil marmar toshlari uslubidagi doska dizayni',
      category: ShopItemCategory.BOARD_THEME,
      price: 2500,
      imageUrl: '',
      isActive: true,
      metadata: { darkColor: '#0a4332', lightColor: '#e0f2e9' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'board-midnight',
      name: 'Yarim Tun (Cyber)',
      description: 'Futuristik neon chiziqlari bilan bezatilgan to\'q mavzu',
      category: ShopItemCategory.BOARD_THEME,
      price: 3000,
      imageUrl: '',
      isActive: true,
      metadata: { darkColor: '#0b1120', lightColor: '#334155' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'piece-gold-marble',
      name: 'Oltin Marmar Toshlar',
      description: 'Zarhallangan qirrali va oltin tojli eksklyuziv toshlar to\'plami',
      category: ShopItemCategory.PIECE_SKIN,
      price: 2000,
      imageUrl: '',
      isActive: true,
      metadata: { rim: '#eab308' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'piece-obsidian',
      name: 'Obsidian & Marvarid',
      description: 'Vulkanik qora tosh va oq marvarid ko\'rinishidagi toshlar',
      category: ShopItemCategory.PIECE_SKIN,
      price: 3500,
      imageUrl: '',
      isActive: true,
      metadata: { rim: '#94a3b8' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'frame-grandmaster',
      name: 'Grossmeyster Ramkasi',
      description: 'Profil avataringiz uchun oltin dafna barglari ramkasi',
      category: ShopItemCategory.AVATAR_FRAME,
      price: 5000,
      imageUrl: '',
      isActive: true,
      metadata: {},
      createdAt: new Date().toISOString(),
    },
  ];

  const displayItems = (items && items.length > 0 ? items : fallbackItems).filter(
    (item) => item.category === selectedCategory,
  );

  return (
    <PageContainer
      headerProps={{
        title: 'Shashka Do\'koni',
        showBack: true,
        onBack: () => navigate(-1),
        showBalance: true,
      }}
    >
      <div className="flex flex-col gap-4">
        {/* MVP Notice Banner */}
        <Card className="p-3 bg-gradient-to-r from-violet-950/50 to-indigo-950/40 border-indigo-800/40 text-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-zinc-100">Katalog taqdimoti:</span>
            <span className="text-zinc-400 ml-1">
              Hozircha faqat ko'rish rejimi. Xarid qilish tez kunda ishga tushadi!
            </span>
          </div>
        </Card>

        {/* Categories Tabs */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedCategory(ShopItemCategory.BOARD_THEME);
            }}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all select-none',
              selectedCategory === ShopItemCategory.BOARD_THEME
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            Doskalar
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedCategory(ShopItemCategory.PIECE_SKIN);
            }}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all select-none',
              selectedCategory === ShopItemCategory.PIECE_SKIN
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            Toshlar
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setSelectedCategory(ShopItemCategory.AVATAR_FRAME);
            }}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all select-none',
              selectedCategory === ShopItemCategory.AVATAR_FRAME
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            Ramkalar
          </button>
        </div>

        {/* Catalog Items */}
        <div className="grid grid-cols-1 gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : isError ? (
            <ErrorState
              title="Katalog yuklanmadi"
              message="Internet aloqasini tekshiring."
              onRetry={refetch}
            />
          ) : (
            displayItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-zinc-900/60 border-zinc-800 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 text-indigo-400">
                      {item.category === ShopItemCategory.BOARD_THEME ? (
                        <Palette className="w-6 h-6" />
                      ) : item.category === ShopItemCategory.PIECE_SKIN ? (
                        <CircleDot className="w-6 h-6" />
                      ) : (
                        <Crown className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{item.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-sm">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>{formatNumber(item.price)}</span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    leftIcon={<Lock className="w-3.5 h-3.5 text-zinc-400" />}
                    className="opacity-70"
                  >
                    Tez kunda
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
};
