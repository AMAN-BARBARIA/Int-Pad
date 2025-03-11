import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Create a new organization (tenant)
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
    
    // Create new organization using Tenant model
    const tenant = await prisma.$transaction(async (tx) => {
      // 1. Create the tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: data.name,
          domain: data.description, // Using domain for description
          active: true
        }
      });
      
      // 2. Create the tenant user relationship with ADMIN role
      await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: newTenant.id,
          role: "ADMIN",
          isActive: true
        }
      });
      
      // 3. Create default user settings
      await tx.userSettings.create({
        data: {
          userId: user.id,
          tenantId: newTenant.id,
          maxSchedulesPerDay: 3,
          advanceBookingDays: 30,
          meetingDuration: 30,
          bufferBetweenEvents: 15
        }
      });
      
      return newTenant;
    });
    
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get organization details (using tenant data)
export async function GET(request: NextRequest) {
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
    
    // Get user's tenant associations
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId: user.id },
      include: {
        tenant: true
      }
    });
    
    // Check if user belongs to any organization
    if (tenantUsers.length === 0) {
      return NextResponse.json(
        { message: 'User does not belong to any organization' },
        { status: 404 }
      );
    }
    
    // Get the primary tenant
    const primaryTenantUser = tenantUsers[0];
    const tenantId = primaryTenantUser.tenantId;
    
    // Get all users for this tenant
    const members = await prisma.tenantUser.findMany({
      where: { tenantId },
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
    });
    
    // Format response to match expected organization interface
    const organization = {
      id: primaryTenantUser.tenant.id,
      name: primaryTenantUser.tenant.name,
      description: primaryTenantUser.tenant.domain || "",
      members: members
    };
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 