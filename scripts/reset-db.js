import { prisma } from '../packages/database/dist/index.js';

async function resetDatabase() {
  console.log('🔄 Wiping all database tables to ZERO (Clean State)...');
  try {
    await prisma.$connect();

    // 1. Delete dependent relations
    console.log('Deleting moves...');
    await prisma.move.deleteMany({});

    console.log('Deleting rating histories...');
    await prisma.ratingHistory.deleteMany({});

    console.log('Deleting game invitations...');
    await prisma.gameInvitation.deleteMany({});

    console.log('Deleting friendships...');
    await prisma.friendship.deleteMany({});

    console.log('Deleting reports and admin actions...');
    await prisma.report.deleteMany({});
    await prisma.adminAction.deleteMany({});

    console.log('Deleting sessions...');
    await prisma.session.deleteMany({});

    console.log('Deleting wallet transactions...');
    await prisma.walletTransaction.deleteMany({});

    console.log('Deleting user inventories...');
    await prisma.userInventory.deleteMany({});

    console.log('Deleting referrals...');
    await prisma.referral.deleteMany({});

    console.log('Deleting games...');
    await prisma.game.deleteMany({});

    console.log('Deleting wallets...');
    await prisma.wallet.deleteMany({});

    console.log('Deleting telegram accounts...');
    await prisma.telegramAccount.deleteMany({});

    console.log('Deleting users...');
    await prisma.user.deleteMany({});

    console.log('✅ ALL DATABASE DATA HAS BEEN RESET TO 0 (CLEAN STATE)!');
    
    const userCount = await prisma.user.count();
    const gameCount = await prisma.game.count();
    console.log(`Verified counts -> Users: ${userCount}, Games: ${gameCount}`);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
