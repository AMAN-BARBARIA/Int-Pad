import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IntervieweeStatus } from "@/types/prisma";
import IntervieweeList from "./components/IntervieweeList";
import CSVUploadForm from "./components/CSVUploadForm";
import FilterBar from "./components/FilterBar";

export default async function IntervieweesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // Get the current user with their organization and role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    include: {
      organizations: {
        include: {
          organization: true
        }
      }
    }
  });
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  // Check if user belongs to an organization
  if (!user.organizations || user.organizations.length === 0) {
    redirect("/organization");
  }
  
  // Get the primary organization and role
  const primaryOrgUser = user.organizations[0];
  const role = primaryOrgUser.role;
  const organizationId = primaryOrgUser.organizationId;
  
  // Only ADMIN and HR users can access this page
  if (role !== "ADMIN" && role !== "HR") {
    redirect("/dashboard");
  }
  
  // Parse filters from search params
  const nameFilter = searchParams.name as string | undefined;
  const statusFilter = searchParams.status as IntervieweeStatus | undefined;
  const roundFilter = searchParams.round ? parseInt(searchParams.round as string) : undefined;
  const sortBy = searchParams.sortBy as string | undefined;
  const sortOrder = searchParams.sortOrder as 'asc' | 'desc' | undefined;
  
  // Build the filter conditions
  const filterConditions: any = {
    organizationId: organizationId,
  };
  
  if (nameFilter) {
    filterConditions.name = {
      contains: nameFilter,
    };
  }
  
  if (statusFilter) {
    filterConditions.status = statusFilter;
  }
  
  if (roundFilter !== undefined) {
    filterConditions.currentRound = roundFilter;
  }
  
  // Build the sort options
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || 'asc';
  } else {
    // Default sorting by creation date (newest first)
    orderBy.createdAt = 'desc';
  }
  
  // Fetch interviewees with filters and sorting
  const interviewees = await prisma.interviewee.findMany({
    where: filterConditions,
    include: {
      role: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy,
  });
  
  // Fetch job roles for the filter dropdown
  const roles = await prisma.jobRole.findMany({
    where: { interviewees: { some: { organizationId: organizationId } } },
    orderBy: { title: 'asc' },
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Interviewee Management</h1>
        <CSVUploadForm organizationId={organizationId} />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <FilterBar roles={roles} />
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <IntervieweeList interviewees={interviewees} />
      </div>
    </div>
  );
} 