import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateOrganizationForm from "./components/CreateOrganizationForm";
import UpdateOrganizationForm from "./components/UpdateOrganizationForm";

export default async function OrganizationPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  
  // Get the current user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    redirect("/api/auth/signin");
  }
  
  // Get user's tenant associations
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { userId: user.id },
    include: {
      tenant: true
    }
  });
  
  // Check if user belongs to any tenant
  const hasOrganization = tenantUsers.length > 0;
  
  // If user has a tenant, get the primary one and its members
  let organization = null;
  let members = [];
  
  if (hasOrganization) {
    const primaryTenantUser = tenantUsers[0];
    const tenantId = primaryTenantUser.tenantId;
    
    // Get all users for this tenant
    const tenantAllUsers = await prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    
    organization = {
      id: primaryTenantUser.tenant.id,
      name: primaryTenantUser.tenant.name,
      description: primaryTenantUser.tenant.domain || ""
    };
    
    members = tenantAllUsers;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tenant</h1>
      
      {!hasOrganization ? (
        <CreateOrganizationForm />
      ) : (
        <UpdateOrganizationForm 
          organization={organization} 
          members={members} 
        />
      )}
    </div>
  );
} 