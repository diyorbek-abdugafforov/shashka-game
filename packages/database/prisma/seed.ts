import { PrismaClient, UserRole, ShopItemCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting database seed...');

  // 1. Seed Feature Flags
  console.info('Seeding feature flags...');
  const featureFlags = [
    {
      key: 'tournament',
      enabled: false,
      description: 'Tournament bracket competition mode',
      updatedBy: 'system_seed',
    },
    {
      key: 'premium',
      enabled: false,
      description: 'VIP subscription perks and features',
      updatedBy: 'system_seed',
    },
    {
      key: 'payment',
      enabled: false,
      description: 'Telegram Stars and cryptocurrency payment processing',
      updatedBy: 'system_seed',
    },
    {
      key: 'miniGames',
      enabled: false,
      description: 'Casual mini-puzzles and checkers endgame challenges',
      updatedBy: 'system_seed',
    },
    {
      key: 'shop',
      enabled: true,
      description: 'Cosmetic shop items catalog',
      updatedBy: 'system_seed',
    },
    {
      key: 'shop_purchases',
      enabled: false,
      description: 'Enable in-game transactions and checkout for items',
      updatedBy: 'system_seed',
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        enabled: flag.enabled,
        description: flag.description,
        updatedBy: flag.updatedBy,
      },
      create: flag,
    });
  }

  // 2. Seed System Settings
  console.info('Seeding system settings...');
  const systemSettings = [
    {
      key: 'game.default_turn_timeout_seconds',
      value: '60',
      description: 'Default time per turn limit in seconds before clock drains',
      updatedBy: 'system_seed',
    },
    {
      key: 'game.disconnect_grace_period_seconds',
      value: '45',
      description: 'Time allowed for a disconnected player to reconnect before forfeiture',
      updatedBy: 'system_seed',
    },
    {
      key: 'rating.default_starting_rating',
      value: '1200',
      description: 'Default Elo/Glicko rating for new players',
      updatedBy: 'system_seed',
    },
    {
      key: 'rating.k_factor',
      value: '32',
      description: 'K-factor sensitivity for rating adjustments',
      updatedBy: 'system_seed',
    },
    {
      key: 'economy.daily_reward_coins',
      value: '100',
      description: 'Free coins granted once per 24 hours upon login',
      updatedBy: 'system_seed',
    },
    {
      key: 'economy.game_win_reward_coins',
      value: '50',
      description: 'Coins rewarded to winner of a rated match',
      updatedBy: 'system_seed',
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
        updatedBy: setting.updatedBy,
      },
      create: setting,
    });
  }

  // 3. Seed Sample Shop Items
  console.info('Seeding shop items...');
  const shopItems = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Classic Dark Walnut',
      description: 'Traditional Russian tournament wooden checkerboard aesthetic',
      category: ShopItemCategory.BOARD_THEME,
      price: 500,
      imageUrl: '/assets/themes/boards/walnut.png',
      isActive: true,
      metadata: {
        lightSquare: '#EAD7BD',
        darkSquare: '#8B5A2B',
        borderColor: '#54361A',
      },
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Midnight Obsidian',
      description: 'Sleek dark mode glass and slate board theme',
      category: ShopItemCategory.BOARD_THEME,
      price: 1200,
      imageUrl: '/assets/themes/boards/obsidian.png',
      isActive: true,
      metadata: {
        lightSquare: '#2C3E50',
        darkSquare: '#1A252F',
        borderColor: '#0E171E',
      },
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Imperial Ruby & Gold',
      description: 'Lacquered royal checker pieces with gold crown embossing',
      category: ShopItemCategory.PIECE_SKIN,
      price: 1500,
      imageUrl: '/assets/themes/pieces/imperial.png',
      isActive: true,
      metadata: {
        whitePieceColor: '#D4AF37',
        blackPieceColor: '#9B111E',
        crownColor: '#FFD700',
      },
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'Cyberpunk Neon',
      description: 'Glowing synthetic checkers with vibrant trail effects',
      category: ShopItemCategory.PIECE_SKIN,
      price: 2000,
      imageUrl: '/assets/themes/pieces/neon.png',
      isActive: true,
      metadata: {
        whitePieceColor: '#00F0FF',
        blackPieceColor: '#FF0055',
        glow: true,
      },
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      name: 'Grandmaster Laurel Frame',
      description: 'Prestigious golden laurel wreath avatar frame for champions',
      category: ShopItemCategory.AVATAR_FRAME,
      price: 3000,
      imageUrl: '/assets/themes/frames/laurel.png',
      isActive: true,
      metadata: {
        rarity: 'legendary',
      },
    },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        imageUrl: item.imageUrl,
        isActive: item.isActive,
        metadata: item.metadata,
      },
      create: item,
    });
  }

  // 4. Seed Test Administrator User
  console.info('Seeding test admin user...');
  const adminId = '00000000-0000-0000-0000-000000000001';
  const adminUser = await prisma.user.upsert({
    where: { id: adminId },
    update: {
      role: UserRole.SUPER_ADMIN,
      displayName: 'System Admin',
      username: 'admin',
    },
    create: {
      id: adminId,
      username: 'admin',
      displayName: 'System Admin',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      language: 'ru',
      role: UserRole.SUPER_ADMIN,
      isBot: false,
      rating: 1600,
    },
  });

  await prisma.telegramAccount.upsert({
    where: { userId: adminUser.id },
    update: {
      telegramId: '123456789',
      username: 'admin_shashka',
      firstName: 'System',
      lastName: 'Admin',
    },
    create: {
      telegramId: '123456789',
      username: 'admin_shashka',
      firstName: 'System',
      lastName: 'Admin',
      userId: adminUser.id,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {
      balance: 50000,
    },
    create: {
      userId: adminUser.id,
      balance: 50000,
    },
  });

  console.info('✅ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
