import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IntervieweeDetailsClient from "./IntervieweeDetailsClient";

export const dynamic = 'force-dynamic';

export default async function IntervieweeDetailsPage({
  params,
}: {
  params: { id: string };
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
  
  // Only ADMIN, HR, and INTERVIEWER users can access this page
  if (role !== "ADMIN" && role !== "HR" && role !== "INTERVIEWER") {
    redirect("/dashboard");
  }
  
  // Get the ID from params 
  // In Next.js 15, params is now a Promise-like object that can be destructured directly
  const { id: intervieweeId } = params;
  
  // Fetch the interviewee with all related data
  const interviewee = await prisma.interviewee.findUnique({
    where: { 
      id: intervieweeId,
      tenantId: tenantId
    },
    include: {
      role: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      },
      bookings: {
        orderBy: { startTime: 'desc' },
        include: { interviewer: true }
      }
    }
  });
  
  if (!interviewee) {
    notFound();
  }
  
  return <IntervieweeDetailsClient interviewee={interviewee} userRole={role} />;
} 