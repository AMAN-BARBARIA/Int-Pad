import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { IntervieweeStatus } from '@/types/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenants: {
          include: {
            tenant: true
          }
        }
      }
    });
    
    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user belongs to a tenant
    if (!user.tenants || user.tenants.length === 0) {
      return NextResponse.json(
        { message: 'User does not belong to any tenant' },
        { status: 400 }
      );
    }
    
    // Get the primary tenant and role
    const primaryTenantUser = user.tenants[0];
    const role = primaryTenantUser.role;
    const tenantId = primaryTenantUser.tenantId;
    
    // Check if the user has permission to update interviewee status
    if (role !== 'ADMIN' && role !== 'HR' && role !== 'INTERVIEWER') {
      return NextResponse.json(
        { message: 'You do not have permission to update interviewee status' },
        { status: 403 }
      );
    }
    
    // Get the interviewee ID from the URL params
    const intervieweeId = params.id;
    
    // Check if the interviewee exists and belongs to the user's tenant
    const interviewee = await prisma.interviewee.findUnique({
      where: {
        id: intervieweeId,
        tenantId: tenantId,
      },
    });
    
    if (!interviewee) {
      return NextResponse.json(
        { message: 'Interviewee not found in your tenant' },
        { status: 404 }
      );
    }
    
    // Parse the request body to get the status
    const body = await request.json();
    const { note, roundResult } = body;
    let { status } = body;
    
    // Validate the status
    const validStatuses = Object.values(IntervieweeStatus);
    if (!status || !validStatuses.includes(status as IntervieweeStatus)) {
      return NextResponse.json(
        { message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the previous status for the log
    const previousStatus = interviewee.status;
    let currentRound = interviewee.currentRound || 0;
    
    // Update round based on status changes and round results
    if (status === IntervieweeStatus.IN_PROGRESS && 
        (previousStatus === IntervieweeStatus.SCHEDULED || previousStatus === IntervieweeStatus.CONTACTED) && 
        currentRound === 0) {
      // Set to round 1 when transitioning to IN_PROGRESS from SCHEDULED or CONTACTED
      currentRound = 1;
    } else if (roundResult === 'PASS') {
      // Increment round when passing
      currentRound += 1;
      
      // If they've completed round 3 and passed, mark as COMPLETED
      if (currentRound > 3 && status === IntervieweeStatus.IN_PROGRESS) {
        status = IntervieweeStatus.COMPLETED;
      }
    }
    
    // Update the interviewee status and round
    const updatedInterviewee = await prisma.interviewee.update({
      where: {
        id: intervieweeId,
      },
      data: {
        status: status as IntervieweeStatus,
        currentRound: currentRound,
      },
    });

    // Create a system-generated note about the status change if no note is provided
    let noteContent = '';
    
    if (note) {
      // Use the provided note
      noteContent = note;
    } else if (roundResult) {
      // Create a note about the round result
      if (roundResult === 'PASS' && status === IntervieweeStatus.COMPLETED) {
        noteContent = `[SYSTEM] Candidate passed final round and marked as completed.`;
      } else {
        noteContent = `[SYSTEM] Round ${interviewee.currentRound} ${roundResult}.`;
      }
    } else if (status === IntervieweeStatus.SCHEDULED && previousStatus !== IntervieweeStatus.SCHEDULED) {
      // Create a note about scheduling
      noteContent = `[SYSTEM] Candidate marked as scheduled.`;
    } else if (status === IntervieweeStatus.IN_PROGRESS && previousStatus !== IntervieweeStatus.IN_PROGRESS && currentRound === 1) {
      // Create a note about starting the interview process
      noteContent = `[SYSTEM] Starting interview process. Round 1 in progress.`;
    } else {
      // Create a note about the status change
      noteContent = `[SYSTEM] Status changed from ${previousStatus} to ${status}`;
    }
    
    // Add the note
    await prisma.intervieweeNote.create({
      data: {
        content: noteContent,
        intervieweeId,
        userId: user.id,
        tenantId: tenantId
      }
    });
    
    return NextResponse.json(updatedInterviewee);
  } catch (error) {
    console.error('Error updating interviewee status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 