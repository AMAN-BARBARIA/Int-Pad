"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CalendarIcon, UserGroupIcon, LinkIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

interface Booking {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  zoomJoinUrl?: string | null;
  intervieweeName: string;
  intervieweeEmail: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [isSettingsComplete, setIsSettingsComplete] = useState(false);
  const [isAvailabilitySet, setIsAvailabilitySet] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user has availability set
        const availabilityResponse = await fetch('/api/availability');
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          setIsAvailabilitySet(availabilityData.availabilitySlots && availabilityData.availabilitySlots.length > 0);
        }
        
        // For now, we'll consider settings complete if the user is logged in
        // In a real app, you would check if they've connected their Google Calendar
        setIsSettingsComplete(true);
        
        // Set the shareable link
        if (session?.user?.id) {
          setShareableLink(`${window.location.origin}/book/${session.user.id}`);
        }
        
        // Fetch bookings
        const bookingsResponse = await fetch('/api/bookings');
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setUpcomingBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session?.user?.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Getting Started</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-5 w-5 rounded-full ${isSettingsComplete ? 'bg-green-500' : 'bg-gray-300'} mt-1`}></div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Connect your accounts</h3>
                  <p className="text-sm text-gray-500">
                    Connect your Google Calendar to sync your schedule. Zoom integration is optional.
                  </p>
                  {!isSettingsComplete && (
                    <Link href="/dashboard/settings" className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500">
                      Go to Settings
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-5 w-5 rounded-full ${isAvailabilitySet ? 'bg-green-500' : 'bg-gray-300'} mt-1`}></div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Set your availability</h3>
                  <p className="text-sm text-gray-500">
                    Configure when you&apos;re available for interviews, how many per day, and other preferences.
                  </p>
                  {!isAvailabilitySet && (
                    <Link href="/dashboard/availability" className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500">
                      Set Availability
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-5 w-5 rounded-full ${isAvailabilitySet ? 'bg-green-500' : 'bg-gray-300'} mt-1`}></div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Share your booking link</h3>
                  <p className="text-sm text-gray-500">
                    Share your unique booking link with candidates so they can schedule interviews.
                  </p>
                  {isAvailabilitySet ? (
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-500 mr-2 truncate max-w-xs">{shareableLink}</span>
                      <button 
                        onClick={copyToClipboard}
                        className="text-indigo-600 hover:text-indigo-500 flex items-center"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        {linkCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Complete the steps above to get your booking link.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Upcoming Interviews</h2>
            <Link 
              href="/dashboard/bookings" 
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {upcomingBookings.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <li key={booking.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserGroupIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{booking.title}</p>
                          <p className="text-sm text-gray-500">
                            {booking.intervieweeName} • {booking.date}
                          </p>
                          <p className="text-sm text-gray-500">{booking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : booking.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        {booking.zoomJoinUrl && (
                          <a 
                            href={booking.zoomJoinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-indigo-600 hover:text-indigo-500"
                          >
                            <VideoCameraIcon className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming interviews</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don&apos;t have any interviews scheduled yet.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Share your booking link to start receiving interview requests.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-4">This Week&apos;s Schedule</h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Your weekly schedule</h3>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your availability for this week.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/availability"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 