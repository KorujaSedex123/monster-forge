import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Mostra no terminal quando o banco é consultado (útil para debug)
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;