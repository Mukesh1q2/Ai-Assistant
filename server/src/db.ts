/**
 * Database Client — Prisma ORM
 * Single source of truth for all database access.
 */

import { PrismaClient } from '@prisma/client';

// Use a global variable to prevent multiple instances during hot-reload in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
