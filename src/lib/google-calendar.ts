import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// Define types for Google Calendar events
interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  [key: string]: any; // Allow for additional properties
}

/**
 * Fetches data from the Google Calendar API with automatic token refreshing
 * @param endpoint The Google Calendar API endpoint to call
 * @param req The Next.js request object
 * @param options Additional fetch options
 * @returns The response from the Google Calendar API
 */
export async function fetchGoogleCalendar(
  endpoint: string,
  req: NextRequest,
  options: RequestInit = {}
) {
  const token = await getToken({ req });
  
  if (!token?.accessToken) {
    throw new Error("No access token found");
  }
  
  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  
  if (response.status === 401) {
    // Token might be expired, but should be automatically refreshed on next request
    throw new Error("Access token expired");
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Error calling Google Calendar API");
  }
  
  return response.json();
}

/**
 * Lists the user's calendars
 * @param req The Next.js request object
 * @returns A list of the user's calendars
 */
export async function listCalendars(req: NextRequest) {
  return fetchGoogleCalendar("/users/me/calendarList", req);
}

/**
 * Creates a new event in the user's calendar
 * @param req The Next.js request object
 * @param calendarId The ID of the calendar to create the event in
 * @param event The event data
 * @returns The created event
 */
export async function createEvent(
  req: NextRequest,
  calendarId: string,
  event: GoogleCalendarEvent
) {
  return fetchGoogleCalendar(`/calendars/${calendarId}/events`, req, {
    method: "POST",
    body: JSON.stringify(event),
  });
}

/**
 * Updates an existing event in the user's calendar
 * @param req The Next.js request object
 * @param calendarId The ID of the calendar containing the event
 * @param eventId The ID of the event to update
 * @param event The updated event data
 * @returns The updated event
 */
export async function updateEvent(
  req: NextRequest,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
) {
  return fetchGoogleCalendar(`/calendars/${calendarId}/events/${eventId}`, req, {
    method: "PATCH",
    body: JSON.stringify(event),
  });
}

/**
 * Deletes an event from the user's calendar
 * @param req The Next.js request object
 * @param calendarId The ID of the calendar containing the event
 * @param eventId The ID of the event to delete
 * @returns void
 */
export async function deleteEvent(
  req: NextRequest,
  calendarId: string,
  eventId: string
) {
  return fetchGoogleCalendar(`/calendars/${calendarId}/events/${eventId}`, req, {
    method: "DELETE",
  });
} 