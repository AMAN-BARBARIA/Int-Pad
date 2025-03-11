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
    
    // Get the current user with their tenant information
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
    
    // Check if user has permission (ADMIN, HR, or INTERVIEWER)
    if (role !== UserRole.ADMIN && role !== UserRole.HR && role !== UserRole.INTERVIEWER) {
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
    
    // Check if the interviewee exists in the user's tenant
    const interviewee = await prisma.interviewee.findFirst({
      where: { 
        id: data.intervieweeId,
        tenantId: tenantId
      },
    });
    
    if (!interviewee) {
      return NextResponse.json(
        { message: 'Interviewee not found in your tenant' },
        { status: 404 }
      );
    }
    
    // Create the note
    const note = await prisma.intervieweeNote.create({
      data: {
        content: data.content,
        intervieweeId: data.intervieweeId,
        userId: user.id,
        tenantId: tenantId
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