"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CalendarIcon, UserGroupIcon, VideoCameraIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

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

export default function BookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/bookings");
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
        } else {
          console.error("Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchBookings();
    }
  }, [session?.user?.id]);

  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(booking => booking.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Your Bookings</h1>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "all"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "confirmed"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "pending"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "cancelled"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredBookings.length > 0 ? (
          <div>
            <ul className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <li key={booking.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{booking.title}</p>
                        <p className="text-sm text-gray-500">
                          {booking.intervieweeName} • {booking.intervieweeEmail}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-500 mr-4">{booking.date}</p>
                          <p className="text-sm text-gray-500">{booking.time}</p>
                        </div>
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
                          title="Join Zoom Meeting"
                        >
                          <VideoCameraIcon className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-6 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all" 
                ? "You don't have any bookings yet." 
                : `You don't have any ${filter} bookings.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 