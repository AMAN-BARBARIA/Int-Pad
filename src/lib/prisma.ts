import { PrismaClient } from '@prisma/client';

// Define a more complete type for the PrismaClient to handle tenant-related models
type PrismaClientWithTenant = PrismaClient & {
  tenant: any;
  tenantUser: any;
  userSettings: any;
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClientWithTenant };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }) as PrismaClientWithTenant;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 