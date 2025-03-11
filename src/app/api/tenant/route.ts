import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Create a new tenant
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
        { message: 'Tenant name is required' },
        { status: 400 }
      );
    }
    
    // Create the tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        domain: data.domain || null,
        logo: data.logo || null,
        active: true,
      }
    });
    
    // Create the tenant user relationship with ADMIN role
    await prisma.tenantUser.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "ADMIN",
        isActive: true
      }
    });
    
    // Create default user settings for this user in the tenant
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        maxSchedulesPerDay: 3,
        advanceBookingDays: 30,
        meetingDuration: 30,
        bufferBetweenEvents: 15,
      },
    });
    
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get tenant details
export async function GET() {
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
        tenants: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user belongs to any tenant
    if (!user.tenants || user.tenants.length === 0) {
      return NextResponse.json(
        { message: 'User does not belong to any tenant' },
        { status: 404 }
      );
    }
    
    // Get the primary tenant
    const primaryTenantUser = user.tenants[0];
    const tenantId = primaryTenantUser.tenantId;
    
    // Get the tenant with all members
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
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
    
    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 