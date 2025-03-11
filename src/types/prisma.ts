import { PrismaClient } from '@prisma/client';

// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: OrganizationUser[];
}

// User types
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizations?: OrganizationUser[];
}

// OrganizationUser types
export interface OrganizationUser {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  organization?: Organization;
}

// Define the status values as string literals
export const IntervieweeStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  REJECTED: 'REJECTED',
  ACCEPTED: 'ACCEPTED',
  ON_HOLD: 'ON_HOLD'
} as const;

// Export the Prisma client type
export type PrismaType = PrismaClient; 