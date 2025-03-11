import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "./prisma";

/**
 * Get the current user's tenant ID from the session
 */
export async function getCurrentUserTenantId() {
  const session = await getServerSession(authOptions);
  return session?.user?.tenantId;
}

/**
 * Get the current user from the session with their tenant information
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenants: {
        include: {
          tenant: true
        }
      }
    }
  });
  
  return user;
}

/**
 * Check if a user is authorized in a specific tenant with a specific role
 */
export async function isAuthorized(userId: string, tenantId: string, roles: string[] = []) {
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId
      }
    }
  });
  
  if (!tenantUser) return false;
  if (!tenantUser.isActive) return false;
  if (roles.length === 0) return true;
  
  return roles.includes(tenantUser.role);
}

/**
 * Get all tenants for a user
 */
export async function getUserTenants(userId: string) {
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { 
      userId,
      isActive: true
    },
    include: {
      tenant: true
    }
  });
  
  return tenantUsers.map(tu => tu.tenant);
}

/**
 * Switch the current user's active tenant
 */
export async function switchTenant(userId: string, tenantId: string) {
  // In a real implementation, you'd update the session or user preferences
  // For now, just check if the user belongs to this tenant
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId
      }
    }
  });
  
  return !!tenantUser;
} 