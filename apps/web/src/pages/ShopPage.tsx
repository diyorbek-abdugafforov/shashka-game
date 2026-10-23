import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '../stores/auth';
import { useSettingsStore, BoardThemeId, PieceSkinId } from '../stores/settings';
import { useTranslation } from '../i18n';
import { formatNumber } from '../utils/format';
import { triggerHaptic } from '../utils/telegram';
import { playCoinSound, playClickSound } from '../utils/sound';
import {
  Coins,
  Palette,
  CircleDot,
  Crown,
  Sparkles,
  Check,
  Gamepad2,
  Gift,
} from 'lucide-react';
import { cn } from '../utils/cn';

const OWNED_STORAGE_KEY = 'shashka_owned_items_v1';

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const { updateBalance } = useAuthStore();
  const { boardTheme, setBoardTheme, pieceSkin, setPieceSkin } = useSettingsStore();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<ShopItemCategory>(
    ShopItemCategory.BOARD_THEME,
  );

  const [ownedItems, setOwnedItems] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(OWNED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : ['classic', 'piece-classic'];
    } catch {
      return ['classic', 'piece-classic'];
    }
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const saveOwnedItems = (newItems: string[]) => {
    setOwnedItems(newItems);
    try {
      localStorage.setItem(OWNED_STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  };

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => shopApi.getItems(),
    staleTime: 60000,
  });

  const fallbackItems: ShopItemModel[] = [
    {
      id: 'board-royal',
      name: "Qirollik Yog'ochi",
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
      description: "Futuristik neon chiziqlari bilan bezatilgan to'q mavzu",
      category: ShopItemCategory.BOARD_THEME,
      price: 3000,
      imageUrl: '',
      isActive: true,
      metadata: { darkColor: '#0b1120', lightColor: '#334155' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'piece-gold-marble',
      name: 'Oltin Toshlar',
      description: "Zarhallangan qirrali va oltin tojli toshlar to'plami",
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
      description: "Vulkanik qora tosh va oq marvarid ko'rinishidagi toshlar",
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
      price: 4500,
      imageUrl: '',
      isActive: true,
      metadata: {},
      createdAt: new Date().toISOString(),
    },
  ];

  const rawList: ShopItemModel[] = Array.isArray(items)
    ? items
    : Array.isArray((items as any)?.data)
    ? (items as any).data
    : Array.isArray((items as any)?.items)
    ? (items as any).items
    : fallbackItems;

  const displayItems = (Array.isArray(rawList) ? rawList : fallbackItems).filter(
    (item) => item && item.category === selectedCategory,
  );

  const handlePurchase = (item: ShopItemModel) => {
    const balance = wallet?.balance ?? 0;
    if (balance < item.price) {
      triggerHaptic('error');
      alert(t('shop_insufficient'));
      return;
    }

    triggerHaptic('success');
    playCoinSound();
    updateBalance(-item.price);
    const updated = [...ownedItems, item.id];
    saveOwnedItems(updated);

    if (item.category === ShopItemCategory.BOARD_THEME) {
      setBoardTheme(item.id as BoardThemeId);
    } else if (item.category === ShopItemCategory.PIECE_SKIN) {
      setPieceSkin(item.id as PieceSkinId);
    }

    setSuccessMessage(`"${item.name}" ${t('shop_success_buy')}`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleEquip = (item: ShopItemModel) => {
    triggerHaptic('selection');
    playClickSound();
    if (item.category === ShopItemCategory.BOARD_THEME) {
      setBoardTheme(item.id as BoardThemeId);
      setSuccessMessage(`"${item.name}" ${t('shop_success_equip')}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else if (item.category === ShopItemCategory.PIECE_SKIN) {
      setPieceSkin(item.id as PieceSkinId);
      setSuccessMessage(`"${item.name}" ${t('shop_success_equip')}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <PageContainer
      headerProps={{
        title: t('shop_title'),
        showBack: true,
        onBack: () => navigate(-1),
        showBalance: true,
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Banner with Mini Games link */}
        <Card className="p-3.5 bg-gradient-to-r from-violet-950/70 via-indigo-950/60 to-zinc-900 border-indigo-700/50 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100">{t('shop_free_coins_banner')}</h3>
              <p className="text-[11px] text-zinc-300">
                {t('shop_free_coins_desc')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/mini-games')}
            className="text-xs whitespace-nowrap ml-2"
          >
            {t('shop_play_btn')}
          </Button>
        </Card>

        {/* Success toast message */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-600/80 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

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
            {t('shop_tab_boards')}
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
            {t('shop_tab_pieces')}
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
            {t('shop_tab_frames')}
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
              title={t('retry')}
              message="Internet aloqasini tekshiring."
              onRetry={refetch}
            />
          ) : (
            displayItems.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped =
                item.category === ShopItemCategory.BOARD_THEME
                  ? boardTheme === item.id
                  : item.category === ShopItemCategory.PIECE_SKIN
                    ? pieceSkin === item.id
                    : false;

              return (
                <Card
                  key={item.id}
                  className="p-4 bg-zinc-900/60 border-zinc-800 flex flex-col justify-between transition-all"
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
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-100">{item.name}</h4>
                          {isEquipped && (
                            <Badge variant="success" size="sm">
                              {t('shop_active')}
                            </Badge>
                          )}
                          {isOwned && !isEquipped && (
                            <Badge variant="neutral" size="sm">
                              {t('shop_owned')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-sm">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>{formatNumber(item.price)} {t('coins')}</span>
                    </div>

                    {isEquipped ? (
                      <Button variant="secondary" size="sm" disabled className="text-emerald-400 border-emerald-800">
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> {t('shop_active')}
                      </Button>
                    ) : isOwned ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEquip(item)}
                      >
                        {t('shop_equip')}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePurchase(item)}
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      >
                        {t('shop_buy')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
};
