import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Only ADMIN and HR users can add notes
    if (role !== "ADMIN" && role !== "HR") {
      return NextResponse.json(
        { message: 'Permission denied' },
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
    
    // Parse the request body
    const { content } = await request.json();
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { message: 'Note content is required' },
        { status: 400 }
      );
    }
    
    // Create the note
    const note = await prisma.intervieweeNote.create({
      data: {
        content: content,
        intervieweeId,
        userId: user.id,
        tenantId: tenantId
      },
    });
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 