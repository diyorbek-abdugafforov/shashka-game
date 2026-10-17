import { prisma } from './src/index.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log(`✅ NEON DATABASE TEST SUCCESS!`);
  console.log(`Connected to: Neon PostgreSQL (Lakebase)`);
  console.log(`Total users found: ${users.length}`);
  if (users[0]) {
    console.log(`Admin user: ${users[0].displayName} (${users[0].role})`);
  }
  const items = await prisma.shopItem.findMany();
  console.log(`Total shop items found: ${items.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Neon query error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
