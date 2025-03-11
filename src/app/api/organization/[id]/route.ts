import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Update a tenant (organization)
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
    
    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the tenant (organization) exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
    });
    
    if (!tenant) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Check if the user belongs to this tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id
        }
      }
    });
    
    if (!tenantUser) {
      return NextResponse.json(
        { message: 'You do not have permission to update this organization' },
        { status: 403 }
      );
    }
    
    // Check if the user is an admin
    if (tenantUser.role !== 'ADMIN') {
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
    
    // Update the tenant (organization)
    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        name: data.name,
        domain: data.description, // Using domain field for description
      },
    });
    
    // Format the response to match Organization interface
    const response = {
      id: updatedTenant.id,
      name: updatedTenant.name,
      description: updatedTenant.domain,
      active: updatedTenant.active,
      createdAt: updatedTenant.createdAt,
      updatedAt: updatedTenant.updatedAt
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 