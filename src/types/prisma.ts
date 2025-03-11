import { PrismaClient } from '@prisma/client';

// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  INTERVIEWER = 'INTERVIEWER',
  USER = 'USER',
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  logo: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  users?: TenantUser[];
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
  tenants?: TenantUser[];
}

// TenantUser types
export interface TenantUser {
  id: string;
  userId: string;
  tenantId: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  tenant?: Tenant;
}

// Interviewee status enum
export enum IntervieweeStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

// Booking status enum
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

// Export the Prisma client type
export type PrismaType = PrismaClient;

export interface UserWithTenants {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  tenants: {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    tenant: {
      id: string;
      name: string;
    };
  }[];
} 