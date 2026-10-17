import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const isProduction = process.env.NODE_ENV === 'production';

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: isProduction
      ? ['error', 'warn']
      : [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
        ],
  });
}

export const prisma: PrismaClient = globalThis.prismaGlobal ?? createPrismaClient();

if (!isProduction) {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
