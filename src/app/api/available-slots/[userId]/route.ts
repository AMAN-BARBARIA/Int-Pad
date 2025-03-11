import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, endOfDay, addMinutes, parseISO, isBefore, isAfter } from "date-fns";

const prisma = new PrismaClient();

// Enum for BookingStatus since the import wasn't working
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

interface ExceptionDate {
  id: string;
  date: Date;
  isBlocked: boolean;
}

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
}

// GET /api/available-slots/[userId]
export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // No need to check for authentication for public booking pages
    // The tenantId parameter is still required
    
    // Access userId from context.params to avoid the Next.js warning
    const userId = context.params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing tenantId parameter" },
        { status: 400 }
      );
    }

    // Get start and end dates from query params, or default to next 14 days
    let startDate = searchParams.get("startDate") 
      ? parseISO(searchParams.get("startDate") as string)
      : new Date();
    
    let endDate = searchParams.get("endDate")
      ? parseISO(searchParams.get("endDate") as string)
      : addDays(new Date(), 14);
    
    // Ensure we're working with the start of the day
    startDate = startOfDay(startDate);
    endDate = endOfDay(endDate);
    
    // Get the interviewer with their tenant-specific settings and availabilities
    const interviewer = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: {
          where: { tenantId }
        },
        availabilities: {
          where: { tenantId }
        },
        exceptionDates: {
          where: {
            tenantId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });
    
    if (!interviewer) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      );
    }
    
    // Get interviewer's userSettings for this tenant
    const userSettings = interviewer.userSettings?.[0];
    
    // Get existing bookings for this interviewer in the date range
    const existingBookings = await prisma.booking.findMany({
      where: {
        tenantId,
        interviewerId: userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });
    
    // Get interviewer settings with defaults if not set
    const meetingDuration = userSettings?.meetingDuration || 30; // default to 30 minutes
    const maxSchedulesPerDay = userSettings?.maxSchedulesPerDay || 10; // default to 10 per day
    const bufferBetweenEvents = userSettings?.bufferBetweenEvents || 15; // default to 15 minutes
    const advanceBookingDays = userSettings?.advanceBookingDays || 30; // default to 30 days
    
    // Limit the end date based on advance booking days setting
    const maxEndDate = addDays(new Date(), advanceBookingDays);
    if (isAfter(endDate, maxEndDate)) {
      endDate = maxEndDate;
    }
    
    // Create a map of exception dates for quick lookup
    const exceptionDatesMap = new Map();
    if (interviewer.exceptionDates) {
      interviewer.exceptionDates.forEach((exception: ExceptionDate) => {
        if (exception.isBlocked) {
          const dateStr = exception.date.toISOString().split("T")[0];
          exceptionDatesMap.set(dateStr, true);
        }
      });
    }
    
    // Create a map of bookings by date for quick lookup and count bookings per day
    const bookingsByDate = new Map();
    const bookingsCountByDate = new Map();
    
    existingBookings.forEach((booking: Booking) => {
      const dateStr = booking.startTime.toISOString().split("T")[0];
      
      // Add to bookings by date map
      if (!bookingsByDate.has(dateStr)) {
        bookingsByDate.set(dateStr, []);
        bookingsCountByDate.set(dateStr, 0);
      }
      bookingsByDate.get(dateStr).push(booking);
      bookingsCountByDate.set(dateStr, bookingsCountByDate.get(dateStr) + 1);
    });
    
    // Generate available time slots
    const availableSlots = [];
    const now = new Date(); // Current time for filtering past slots
    
    // Generate slots for each day in the range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Skip if this date is in the exception dates
      if (exceptionDatesMap.has(dateStr)) {
        // Move to the next day
        currentDate = addDays(currentDate, 1);
        continue;
      }
      
      // Skip if this day has reached the maximum number of bookings
      const bookingsCount = bookingsCountByDate.get(dateStr) || 0;
      if (bookingsCount >= maxSchedulesPerDay) {
        // Move to the next day
        currentDate = addDays(currentDate, 1);
        continue;
      }
      
      // Find availability for this day of the week
      const dayAvailability = interviewer.availabilities?.find(
        (a: Availability) => a.dayOfWeek === dayOfWeek
      );
      
      if (dayAvailability) {
        // Parse the start and end times for this day
        const [startHour, startMinute] = dayAvailability.startTime.split(":").map(Number);
        const [endHour, endMinute] = dayAvailability.endTime.split(":").map(Number);
        
        // Create a date object for the start and end times
        const availabilityStart = new Date(currentDate);
        availabilityStart.setHours(startHour, startMinute, 0, 0);
        
        const availabilityEnd = new Date(currentDate);
        availabilityEnd.setHours(endHour, endMinute, 0, 0);
        
        // Get the existing bookings for this date
        const existingBookingsForDate = bookingsByDate.get(dateStr) || [];
        
        // Generate slots at regular intervals
        let slotStart = new Date(availabilityStart);
        
        while (addMinutes(slotStart, meetingDuration) <= availabilityEnd) {
          const slotEnd = addMinutes(slotStart, meetingDuration);
          
          // Skip slots in the past
          if (isBefore(slotStart, now)) {
            slotStart = addMinutes(slotStart, meetingDuration + bufferBetweenEvents);
            continue;
          }
          
          // Check if this slot overlaps with any existing bookings (including buffer time)
          const isOverlapping = existingBookingsForDate.some((booking: Booking) => {
            // Calculate buffer times
            const bookingStartWithBuffer = addMinutes(booking.startTime, -bufferBetweenEvents);
            const bookingEndWithBuffer = addMinutes(booking.endTime, bufferBetweenEvents);
            
            return (
              (slotStart >= bookingStartWithBuffer && slotStart < bookingEndWithBuffer) ||
              (slotEnd > bookingStartWithBuffer && slotEnd <= bookingEndWithBuffer) ||
              (slotStart <= bookingStartWithBuffer && slotEnd >= bookingEndWithBuffer)
            );
          });
          
          // Only add the slot if it doesn't overlap with existing bookings
          if (!isOverlapping) {
            availableSlots.push({
              id: `${slotStart.getTime()}`,
              startTime: slotStart,
              endTime: slotEnd,
            });
          }
          
          // Move to the next slot (including buffer time)
          slotStart = addMinutes(slotStart, meetingDuration + bufferBetweenEvents);
        }
      }
      
      // Move to the next day
      currentDate = addDays(currentDate, 1);
    }
    
    return NextResponse.json({
      interviewer: {
        id: interviewer.id,
        name: interviewer.name,
        email: interviewer.email,
        meetingDuration: userSettings?.meetingDuration || 30,
      },
      availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
} 