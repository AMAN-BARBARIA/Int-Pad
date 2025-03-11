import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/settings - Get the current user's interview settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to access settings" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the user's interview settings
    const settings = await prisma.interviewSettings.findUnique({
      where: {
        userId: userId,
      },
    });
    
    // If settings don't exist yet, return default values
    if (!settings) {
      return NextResponse.json({
        settings: {
          maxSchedulesPerDay: 3,
          advanceBookingDays: 30,
          meetingDuration: 30,
          bufferBetweenEvents: 15,
          zoomConnected: false,
          googleConnected: false,
        }
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings - Save the current user's interview settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update settings" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    const {
      maxSchedulesPerDay,
      advanceBookingDays,
      meetingDuration,
      bufferBetweenEvents,
      zoomConnected,
      googleConnected,
      zoomData,
      googleData
    } = body;
    
    // Validate required fields
    if (
      maxSchedulesPerDay === undefined ||
      advanceBookingDays === undefined ||
      meetingDuration === undefined ||
      bufferBetweenEvents === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create or update the settings
    const settings = await prisma.interviewSettings.upsert({
      where: {
        userId: userId,
      },
      update: {
        maxSchedulesPerDay,
        advanceBookingDays,
        meetingDuration,
        bufferBetweenEvents,
        zoomConnected: zoomConnected || false,
        googleConnected: googleConnected || false,
        zoomData: zoomData || null,
        googleData: googleData || null,
      },
      create: {
        userId,
        maxSchedulesPerDay,
        advanceBookingDays,
        meetingDuration,
        bufferBetweenEvents,
        zoomConnected: zoomConnected || false,
        googleConnected: googleConnected || false,
        zoomData: zoomData || null,
        googleData: googleData || null,
      },
    });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
} 