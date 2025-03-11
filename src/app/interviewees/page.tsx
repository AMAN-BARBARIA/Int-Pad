import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IntervieweeStatus } from "@/types/prisma";
import IntervieweeList from "./components/IntervieweeList";
import CSVUploadForm from "./components/CSVUploadForm";
import FilterBar from "./components/FilterBar";

export const dynamic = 'force-dynamic';

export default async function IntervieweesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // Get the current user with their tenant information
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    include: {
      tenants: {
        include: {
          tenant: true
        }
      }
    }
  });
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  // Check if user belongs to a tenant
  if (!user.tenants || user.tenants.length === 0) {
    redirect("/dashboard");
  }
  
  // Get the primary tenant and role
  const primaryTenantUser = user.tenants[0];
  const role = primaryTenantUser.role;
  const tenantId = primaryTenantUser.tenantId;
  
  // Only ADMIN and HR users can access this page
  if (role !== "ADMIN" && role !== "HR") {
    redirect("/dashboard");
  }
  
  // Parse filters from search params
  // In Next.js 15, searchParams is now a Promise that should be awaited
  const params = searchParams;
  const nameFilterValue = typeof params.name === 'string' ? params.name : undefined;
  const statusFilterValue = typeof params.status === 'string' ? params.status : undefined;
  const roundFilterValue = typeof params.round === 'string' ? params.round : undefined;
  const roleIdFilterValue = typeof params.roleId === 'string' ? params.roleId : undefined;
  const sortByValue = typeof params.sortBy === 'string' ? params.sortBy : undefined;
  const sortOrderValue = typeof params.sortOrder === 'string' ? params.sortOrder : 'desc';
  
  // Safely convert to appropriate types
  const nameFilter = nameFilterValue;
  const statusFilter = statusFilterValue as IntervieweeStatus | undefined;
  const roundFilter = roundFilterValue ? parseInt(roundFilterValue) : undefined;
  const roleIdFilter = roleIdFilterValue;
  const sortBy = sortByValue;
  const sortOrder = sortOrderValue as 'asc' | 'desc';
  
  // Build the filter conditions
  const filterConditions: any = {
    tenantId: tenantId,
  };
  
  if (nameFilter) {
    filterConditions.OR = [
      { name: { contains: nameFilter } },
      { email: { contains: nameFilter } }
    ];
  }
  
  if (statusFilter) {
    filterConditions.status = statusFilter;
  }
  
  if (roundFilter !== undefined) {
    filterConditions.currentRound = roundFilter;
  }
  
  if (roleIdFilter) {
    filterConditions.roleId = roleIdFilter;
  }
  
  // Build the sort options
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
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
    where: { tenantId: tenantId },
    orderBy: { title: 'asc' },
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Interviewee Management</h1>
        <CSVUploadForm tenantId={tenantId} />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <FilterBar roles={roles} />
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <IntervieweeList interviewees={interviewees} tenantId={tenantId} />
      </div>
    </div>
  );
} 