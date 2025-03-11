import { User } from "@prisma/client";
import { UserRole } from "@/types/prisma";

// Renamed to Tenant but exported as Organization for backward compatibility
export interface Organization {
  id: string;
  name: string;
  domain?: string | null;
  logo?: string | null;
  description?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Also define Tenant interface for new code
export interface Tenant extends Organization {
  // Same structure as Organization but with explicit Tenant name
}

// Renamed to TenantUser but exported as OrganizationUser for backward compatibility
export interface OrganizationUser {
  id: string;
  userId: string;
  tenantId: string; // Changed from organizationId to tenantId
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  tenant?: Tenant; // Changed from organization to tenant
}

// Also define TenantUser interface for new code
export interface TenantUser extends Omit<OrganizationUser, 'organizationId' | 'organization'> {
  tenantId: string;
  tenant?: Tenant;
}

export type OrganizationWithMembers = Organization & {
  members: User[];
};

// Also define TenantWithMembers for new code
export type TenantWithMembers = Tenant & {
  users: User[];
};

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
};

export type OrganizationFormData = {
  name: string;
  description?: string;
}; 