import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { format, startOfDay, endOfDay } from "date-fns";
import { BookingStatus } from "@/types/prisma";

const prisma = new PrismaClient();

// GET /api/bookings - Get all bookings for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be signed in to view bookings" },
        { status: 401 }
      );
    }
    
    // Get the current user with tenant information
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenants: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user belongs to a tenant
    if (!user.tenants || user.tenants.length === 0) {
      return NextResponse.json(
        { error: "User does not belong to any tenant" },
        { status: 400 }
      );
    }
    
    // Get the primary tenant
    const primaryTenantUser = user.tenants[0];
    const tenantId = primaryTenantUser.tenantId;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role") || "interviewer"; // Default to interviewer role
    
    // Fetch bookings based on role and tenant
    let bookings;
    if (role === "interviewer") {
      bookings = await prisma.booking.findMany({
        where: {
          tenantId,
          interviewerId: user.id,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: {
          tenantId,
          candidateId: searchParams.get("candidateId") || undefined,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    }
    
    // Format the bookings for the frontend
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      title: booking.title,
      interviewerId: booking.interviewerId,
      intervieweeEmail: booking.intervieweeEmail,
      intervieweeName: booking.intervieweeName,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      zoomMeetingId: booking.zoomMeetingId,
      zoomJoinUrl: booking.zoomJoinUrl,
      feedback: booking.feedback,
      createdAt: booking.createdAt,
    }));
    
    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      interviewerId, 
      startTime, 
      endTime, 
      intervieweeName, 
      intervieweeEmail,
      title,
      intervieweeId,
      tenantId: requestTenantId // Get tenantId from request body for public booking page
    } = body;
    
    // Validate required fields
    if (!interviewerId || !startTime || !endTime || !intervieweeName || !intervieweeEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    let tenantId: string;
    
    // Check if the request is authenticated (internal booking) or public (external booking)
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.email;
    
    if (isAuthenticated) {
      // For authenticated users, get tenant from their session/profile
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          tenants: true
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      // Check if user belongs to a tenant
      if (!user.tenants || user.tenants.length === 0) {
        return NextResponse.json(
          { error: "User does not belong to any tenant" },
          { status: 400 }
        );
      }
      
      // Get the primary tenant
      const primaryTenantUser = user.tenants[0];
      tenantId = primaryTenantUser.tenantId;
    } else {
      // For public booking requests, use tenantId from request body
      if (!requestTenantId) {
        return NextResponse.json(
          { error: "Missing tenantId parameter for public booking" },
          { status: 400 }
        );
      }
      tenantId = requestTenantId as string;
    }
    
    // Check if the interviewer exists
    const interviewer = await prisma.user.findUnique({
      where: { id: interviewerId },
      include: { 
        userSettings: {
          where: { tenantId }
        }
      }
    });
    
    if (!interviewer) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      );
    }
    
    // Get the user settings
    const userSettings = interviewer.userSettings?.[0];
    
    // Get the maximum number of bookings per day
    const maxSchedulesPerDay = userSettings?.maxSchedulesPerDay || 3;
    
    // Get the booking date
    const bookingDate = new Date(startTime);
    const bookingDateStart = startOfDay(bookingDate);
    const bookingDateEnd = endOfDay(bookingDate);
    
    // Check if the maximum number of bookings has been reached for this day
    const existingBookingsCount = await prisma.booking.count({
      where: {
        tenantId,
        interviewerId,
        startTime: {
          gte: bookingDateStart,
          lte: bookingDateEnd,
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        }
      }
    });
    
    if (existingBookingsCount >= maxSchedulesPerDay) {
      return NextResponse.json(
        { error: `The interviewer can only have ${maxSchedulesPerDay} bookings per day` },
        { status: 400 }
      );
    }
    
    // Check if there's a booking conflict
    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        tenantId,
        interviewerId,
        OR: [
          {
            // New booking starts during an existing booking
            startTime: { lte: bookingStart },
            endTime: { gt: bookingStart }
          },
          {
            // New booking ends during an existing booking
            startTime: { lt: bookingEnd },
            endTime: { gte: bookingEnd }
          },
          {
            // New booking contains an existing booking
            startTime: { gte: bookingStart },
            endTime: { lte: bookingEnd }
          }
        ],
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        }
      }
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "There is already a booking scheduled for this time slot" },
        { status: 400 }
      );
    }
    
    // If intervieweeId is provided, check if the interviewee exists
    let interviewee = null;
    if (intervieweeId) {
      interviewee = await prisma.interviewee.findUnique({
        where: { 
          id: intervieweeId,
          tenantId 
        }
      });
      
      if (!interviewee) {
        return NextResponse.json(
          { error: "Interviewee not found" },
          { status: 404 }
        );
      }
      
      // Check if the interviewee status is valid for booking
      if (interviewee.status !== "CONTACTED" && 
          interviewee.status !== "SCHEDULED" && 
          interviewee.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Cannot schedule interviews for interviewees with status: " + interviewee.status },
          { status: 400 }
        );
      }
    } else {
      // Try to find the interviewee by email
      interviewee = await prisma.interviewee.findFirst({
        where: { 
          email: intervieweeEmail,
          tenantId
        }
      });
      
      // If interviewee exists, check status
      if (interviewee && 
          interviewee.status !== "CONTACTED" && 
          interviewee.status !== "SCHEDULED" && 
          interviewee.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Cannot schedule interviews for interviewees with status: " + interviewee.status },
          { status: 400 }
        );
      }
    }
    
    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        title: title || `Interview with ${intervieweeName}`,
        startTime: bookingStart,
        endTime: bookingEnd,
        interviewerId,
        intervieweeEmail,
        intervieweeName,
        status: BookingStatus.CONFIRMED,
        tenantId,
        candidateId: intervieweeId
      },
    });
    
    // If there's an interviewee ID, create a note for the interviewee and update status
    if (intervieweeId && interviewee) {
      // Add a note about the scheduled interview
      await prisma.intervieweeNote.create({
        data: {
          content: `Interview scheduled for ${format(bookingStart, "EEEE, MMMM d, yyyy 'at' h:mm a")}`,
          intervieweeId,
          userId: user.id,
          tenantId
        }
      });
      
      // Determine the new status and round
      let newStatus = interviewee.status;
      let currentRound = interviewee.currentRound || 0;
      let statusNote = '';
      
      if (interviewee.status === "CONTACTED") {
        // If contacted, change to scheduled
        newStatus = "SCHEDULED";
        statusNote = "[SYSTEM] Status updated to SCHEDULED";
      } else if (interviewee.status === "SCHEDULED") {
        // If scheduled, change to in progress and set round to 1
        newStatus = "IN_PROGRESS";
        currentRound = 1;
        statusNote = "[SYSTEM] Status updated to IN_PROGRESS, starting Round 1";
      } else if (interviewee.status === "IN_PROGRESS") {
        // If already in progress, increment the round
        currentRound += 1;
        statusNote = `[SYSTEM] New interview scheduled for Round ${currentRound}`;
      }
      
      // Create a note about status/round change
      if (statusNote) {
        await prisma.intervieweeNote.create({
          data: {
            content: statusNote,
            intervieweeId,
            userId: user.id,
            tenantId
          }
        });
      }
      
      // Update the interviewee status and round
      await prisma.interviewee.update({
        where: { id: intervieweeId },
        data: { 
          status: newStatus,
          currentRound: currentRound
        }
      });
    }
    
    // If the interviewer has Zoom connected, create a Zoom meeting
    if (interviewer.interviewSettings?.zoomConnected) {
      // In a real app, you would create a Zoom meeting here
      // and update the booking with the Zoom meeting details
      console.log("Would create Zoom meeting here");
    }
    
    // If the interviewer has Google Calendar connected, create a calendar event
    if (interviewer.interviewSettings?.googleConnected) {
      // In a real app, you would create a Google Calendar event here
      console.log("Would create Google Calendar event here");
    }
    
    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
} 