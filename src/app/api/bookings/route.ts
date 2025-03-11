import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { format, startOfDay, endOfDay } from "date-fns";

const prisma = new PrismaClient();

// GET /api/bookings - Get all bookings for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view bookings" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role") || "interviewer"; // Default to interviewer role
    
    // Fetch bookings based on role
    let bookings;
    if (role === "interviewer") {
      bookings = await prisma.booking.findMany({
        where: {
          interviewerId: userId,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: {
          intervieweeId: userId,
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
      startTime: booking.startTime,
      endTime: booking.endTime,
      intervieweeName: booking.intervieweeName,
      intervieweeEmail: booking.intervieweeEmail,
      status: booking.status,
      zoomMeetingId: booking.zoomMeetingId,
      zoomJoinUrl: booking.zoomJoinUrl,
      date: format(booking.startTime, "EEEE, MMMM d, yyyy"),
      time: `${format(booking.startTime, "h:mm a")} - ${format(booking.endTime, "h:mm a")}`,
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
      intervieweeId
    } = body;
    
    if (!interviewerId || !startTime || !endTime || !intervieweeName || !intervieweeEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if the interviewer exists
    const interviewer = await prisma.user.findUnique({
      where: { id: interviewerId },
      include: { interviewSettings: true }
    });
    
    if (!interviewer) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      );
    }
    
    // Get the maximum number of bookings per day
    const maxSchedulesPerDay = interviewer.interviewSettings?.maxSchedulesPerDay || 3;
    
    // Get the booking date
    const bookingDate = new Date(startTime);
    const bookingDateStart = startOfDay(bookingDate);
    const bookingDateEnd = endOfDay(bookingDate);
    
    // Check if the maximum number of bookings has been reached for this day
    const existingBookingsCount = await prisma.booking.count({
      where: {
        interviewerId,
        startTime: {
          gte: bookingDateStart,
          lte: bookingDateEnd,
        },
        status: {
          in: ["pending", "confirmed"]
        }
      }
    });
    
    if (existingBookingsCount >= maxSchedulesPerDay) {
      return NextResponse.json(
        { error: "Maximum number of bookings reached for this day" },
        { status: 400 }
      );
    }
    
    // Check if the time slot is already booked
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        interviewerId,
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gt: new Date(startTime) }
          },
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gte: new Date(endTime) }
          },
          {
            startTime: { gte: new Date(startTime) },
            endTime: { lte: new Date(endTime) }
          }
        ],
        status: {
          in: ["pending", "confirmed"]
        }
      }
    });
    
    if (overlappingBooking) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }
    
    // If intervieweeId is provided, check if the interviewee exists
    let interviewee = null;
    if (intervieweeId) {
      interviewee = await prisma.interviewee.findUnique({
        where: { id: intervieweeId }
      });
      
      if (!interviewee) {
        return NextResponse.json(
          { error: "Interviewee not found" },
          { status: 404 }
        );
      }
    } else {
      // Try to find the interviewee by email
      interviewee = await prisma.interviewee.findFirst({
        where: { email: intervieweeEmail }
      });
    }
    
    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        title: title || `Interview with ${intervieweeName}`,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        interviewerId,
        intervieweeName,
        intervieweeEmail,
        status: "confirmed",
        candidateId: interviewee?.id,
      },
    });
    
    // If the booking is for an interviewee, update their status if needed
    if (interviewee) {
      // Only allow booking for interviewees in SCHEDULED or CONTACTED status
      if (interviewee.status === 'SCHEDULED' || interviewee.status === 'CONTACTED') {
        // Update to IN_PROGRESS and set round to 1
        await prisma.interviewee.update({
          where: { id: interviewee.id },
          data: { 
            status: 'IN_PROGRESS',
            currentRound: 1
          }
        });
        
        // Add a system note about starting the interview process
        await prisma.intervieweeNote.create({
          data: {
            content: `[SYSTEM] Interview scheduled with ${interviewer.name} on ${format(new Date(startTime), 'MMMM d, yyyy')} at ${format(new Date(startTime), 'h:mm a')}. Status updated to IN_PROGRESS, starting round 1.`,
            intervieweeId: interviewee.id,
            userId: interviewer.id
          }
        });
      } else if (interviewee.status !== 'IN_PROGRESS') {
        // Don't allow booking for interviewees not in SCHEDULED, CONTACTED, or IN_PROGRESS status
        return NextResponse.json(
          { error: "Booking is only allowed for interviewees in SCHEDULED, CONTACTED, or IN_PROGRESS status" },
          { status: 400 }
        );
      } else {
        // For IN_PROGRESS status, just add a note about the interview being scheduled
        await prisma.intervieweeNote.create({
          data: {
            content: `[SYSTEM] Interview for round ${interviewee.currentRound} scheduled with ${interviewer.name} on ${format(new Date(startTime), 'MMMM d, yyyy')} at ${format(new Date(startTime), 'h:mm a')}`,
            intervieweeId: interviewee.id,
            userId: interviewer.id
          }
        });
      }
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