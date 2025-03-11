import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Update an organization
export async function PATCH(
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
    
    // Get the current user with their organizations
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
    });
    
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Check if the user belongs to this organization
    const orgUser = user.organizations.find(ou => ou.organizationId === organization.id);
    
    if (!orgUser) {
      return NextResponse.json(
        { message: 'You do not have permission to update this organization' },
        { status: 403 }
      );
    }
    
    // Check if the user is an admin
    if (orgUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only admins can update the organization' },
        { status: 403 }
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
    
    // Update the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    
    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 