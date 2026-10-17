import { prisma } from '../packages/database/dist/index.js';

async function testConnection() {
  console.log('Testing connection to Neon PostgreSQL database...');
  try {
    await prisma.$connect();
    console.log('✅ DATABASE CONNECTED SUCCESSFULLY!');

    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        displayName: true,
        username: true,
        rating: true,
        wallet: { select: { balance: true } },
      },
    });
    console.log('Sample users:', JSON.stringify(users, null, 2));

    const gameCount = await prisma.game.count();
    console.log(`🎮 Total games in database: ${gameCount}`);

    const tournamentCount = await prisma.tournament?.count?.().catch(() => 0) || 0;
    console.log(`🏆 Tournaments in database: ${tournamentCount}`);
  } catch (error) {
    console.error('❌ Database Connection Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
