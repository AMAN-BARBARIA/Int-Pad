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
        organizations: {
          include: {
            organization: true
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
    
    // Check if user belongs to an organization
    if (!user.organizations || user.organizations.length === 0) {
      return NextResponse.json(
        { message: 'User does not belong to any organization' },
        { status: 400 }
      );
    }
    
    // Get the primary organization and role
    const primaryOrgUser = user.organizations[0];
    const role = primaryOrgUser.role;
    const organizationId = primaryOrgUser.organizationId;
    
    // Check if the user has permission to update interviewee status
    if (role !== 'ADMIN' && role !== 'HR' && role !== 'INTERVIEWER') {
      return NextResponse.json(
        { message: 'You do not have permission to update interviewee status' },
        { status: 403 }
      );
    }
    
    // Get the interviewee ID from the URL params
    const intervieweeId = params.id;
    
    // Check if the interviewee exists and belongs to the user's organization
    const interviewee = await prisma.interviewee.findUnique({
      where: {
        id: intervieweeId,
        organizationId: organizationId,
      },
    });
    
    if (!interviewee) {
      return NextResponse.json(
        { message: 'Interviewee not found' },
        { status: 404 }
      );
    }
    
    // Parse the request body to get the status
    const body = await request.json();
    const { status, note, roundResult } = body;
    
    // Validate the status
    if (!status || !Object.values(IntervieweeStatus).includes(status as IntervieweeStatus)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the previous status for the log
    const previousStatus = interviewee.status;
    let currentRound = interviewee.currentRound || 0;
    
    // Update round based on status changes and round results
    if (status === 'IN_PROGRESS' && (previousStatus === 'SCHEDULED' || previousStatus === 'CONTACTED')) {
      // Set to round 1 when transitioning to IN_PROGRESS from SCHEDULED or CONTACTED
      currentRound = 1;
    } else if (roundResult === 'PASS') {
      // Increment round when passing
      currentRound += 1;
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
      noteContent = `[SYSTEM] Round ${interviewee.currentRound} ${roundResult}.`;
    } else if (status === 'SCHEDULED' && previousStatus !== 'SCHEDULED' && currentRound === 1) {
      // Create a note about starting the interview process
      noteContent = `[SYSTEM] First interview scheduled. Starting round 1.`;
    } else {
      // Create a note about the status change
      noteContent = `[SYSTEM] Status changed from ${previousStatus} to ${status}`;
    }
    
    // Add the note
    await prisma.intervieweeNote.create({
      data: {
        content: noteContent,
        intervieweeId,
        userId: user.id
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