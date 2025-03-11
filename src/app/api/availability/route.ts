import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ExceptionDate {
  id?: string;
  date: Date | string;
  isBlocked: boolean;
}

// GET endpoint to fetch user's availability
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user with tenant information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenants: true
      }
    });
    
    if (!user || !user.tenants || user.tenants.length === 0) {
      return NextResponse.json({ error: "User not associated with any tenant" }, { status: 400 });
    }
    
    // Get the primary tenant
    const primaryTenantUser = user.tenants[0];
    const tenantId = primaryTenantUser.tenantId;
    
    // Fetch the user's availability slots
    const availabilitySlots = await prisma.availability.findMany({
      where: {
        userId: session.user.id,
        tenantId: tenantId
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
    
    // Fetch the user's exception dates
    const exceptionDates = await prisma.exceptionDate.findMany({
      where: {
        userId: session.user.id,
        tenantId: tenantId
      },
      orderBy: {
        date: 'asc',
      },
    });
    
    return NextResponse.json({ availabilitySlots, exceptionDates });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to save user's availability
export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user with tenant information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tenants: true
      }
    });
    
    if (!user || !user.tenants || user.tenants.length === 0) {
      return NextResponse.json({ error: "User not associated with any tenant" }, { status: 400 });
    }
    
    // Get the primary tenant
    const primaryTenantUser = user.tenants[0];
    const tenantId = primaryTenantUser.tenantId;
    
    // Get the availability data from the request body
    const { availabilitySlots, exceptionDates } = await req.json() as {
      availabilitySlots: AvailabilitySlot[];
      exceptionDates: ExceptionDate[];
    };
    
    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing availability slots
      await tx.availability.deleteMany({
        where: {
          userId: session.user.id,
          tenantId: tenantId
        },
      });
      
      // Create new availability slots
      const newAvailabilitySlots = await Promise.all(
        availabilitySlots.map((slot) => 
          tx.availability.create({
            data: {
              userId: session.user.id,
              tenantId: tenantId,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          })
        )
      );
      
      // Delete existing exception dates
      await tx.exceptionDate.deleteMany({
        where: {
          userId: session.user.id,
          tenantId: tenantId
        },
      });
      
      // Create new exception dates
      const newExceptionDates = await Promise.all(
        exceptionDates.map((date) => 
          tx.exceptionDate.create({
            data: {
              userId: session.user.id,
              tenantId: tenantId,
              date: new Date(date.date),
              isBlocked: date.isBlocked,
            },
          })
        )
      );
      
      return { newAvailabilitySlots, newExceptionDates };
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Availability settings saved successfully",
      data: result
    });
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 