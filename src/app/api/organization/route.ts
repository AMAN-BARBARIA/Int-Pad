import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@/types/prisma';
import { prisma } from '@/lib/prisma';

// Create a new organization
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
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { message: 'Organization name is required' },
        { status: 400 }
      );
    }
    
    // Create the organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        description: data.description,
      }
    });
    
    // Create the organization user relationship with ADMIN role
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "ADMIN"
      }
    });
    
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get organization details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user belongs to any organization
    if (user.organizations.length === 0) {
      return NextResponse.json(
        { message: 'User does not belong to any organization' },
        { status: 404 }
      );
    }
    
    // Get the primary organization
    const primaryOrgUser = user.organizations[0];
    const organizationId = primaryOrgUser.organizationId;
    
    // Get the organization with all members
    const organization = await prisma.organization.findUnique({
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
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 