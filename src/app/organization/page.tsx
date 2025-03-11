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
  
  // Get the current user with their organizations
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organizations: {
        include: {
          organization: true
        }
      }
    }
  });
  
  if (!user) {
    redirect("/api/auth/signin");
  }
  
  // Check if user belongs to any organization
  const hasOrganization = user.organizations.length > 0;
  
  // If user has an organization, get the primary one and its members
  let organization = null;
  let members = [];
  
  if (hasOrganization) {
    const primaryOrgUser = user.organizations[0];
    const organizationId = primaryOrgUser.organizationId;
    
    // Get the organization with all members
    const orgData = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
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
        }
      }
    });
    
    if (orgData) {
      organization = {
        id: orgData.id,
        name: orgData.name,
        description: orgData.description
      };
      
      members = orgData.members;
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Organization</h1>
      
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