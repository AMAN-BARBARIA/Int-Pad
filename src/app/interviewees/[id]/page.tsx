import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IntervieweeDetailsClient from "./IntervieweeDetailsClient";

export default async function IntervieweeDetailsPage({
  params,
}: {
  params: { id: string };
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
  
  // Only ADMIN, HR, and INTERVIEWER users can access this page
  if (role !== "ADMIN" && role !== "HR" && role !== "INTERVIEWER") {
    redirect("/dashboard");
  }
  
  // Fetch the interviewee with all related data
  const interviewee = await prisma.interviewee.findUnique({
    where: { 
      id: params.id,
      organizationId: organizationId
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