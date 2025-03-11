import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@/types/prisma';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission (ADMIN, HR, or INTERVIEWER)
    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.HR &&
      user.role !== UserRole.INTERVIEWER
    ) {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.content) {
      return NextResponse.json(
        { message: 'Note content is required' },
        { status: 400 }
      );
    }
    
    if (!data.intervieweeId) {
      return NextResponse.json(
        { message: 'Interviewee ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the interviewee exists
    const interviewee = await prisma.interviewee.findUnique({
      where: { id: data.intervieweeId },
    });
    
    if (!interviewee) {
      return NextResponse.json(
        { message: 'Interviewee not found' },
        { status: 404 }
      );
    }
    
    // Check if the user belongs to the same organization as the interviewee
    if (user.organizationId !== interviewee.organizationId) {
      return NextResponse.json(
        { message: 'Permission denied: Interviewee belongs to a different organization' },
        { status: 403 }
      );
    }
    
    // Create the note
    const note = await prisma.intervieweeNote.create({
      data: {
        content: data.content,
        intervieweeId: data.intervieweeId,
        userId: user.id,
      },
    });
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 