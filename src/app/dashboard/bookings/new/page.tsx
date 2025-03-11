"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarIcon, ArrowLeftIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format, addHours, parseISO } from "date-fns";

interface Interviewee {
  id: string;
  name: string;
  email: string;
}

export default function NewBookingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const intervieweeId = searchParams.get("intervieweeId");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewee, setInterviewee] = useState<Interviewee | null>(null);
  const [isLoadingInterviewee, setIsLoadingInterviewee] = useState(false);

  useEffect(() => {
    if (intervieweeId) {
      fetchInterviewee(intervieweeId);
    }
  }, [intervieweeId]);

  const fetchInterviewee = async (id: string) => {
    try {
      setIsLoadingInterviewee(true);
      const response = await fetch(`/api/interviewees/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInterviewee(data);
        setTitle(`Interview with ${data.name}`);
      } else {
        setError("Failed to fetch interviewee details");
      }
    } catch (error) {
      console.error("Error fetching interviewee:", error);
      setError("An error occurred while fetching interviewee details");
    } finally {
      setIsLoadingInterviewee(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !startTime || !title) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = format(
        addHours(parseISO(startDateTime), parseInt(duration) / 60),
        "yyyy-MM-dd'T'HH:mm:ss"
      );

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          startTime: startDateTime,
          endTime: endDateTime,
          intervieweeId: interviewee?.id,
          intervieweeName: interviewee?.name,
          intervieweeEmail: interviewee?.email,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/bookings");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setError("An error occurred while creating the booking");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please sign in to create bookings</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/dashboard/bookings" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Bookings
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Schedule Interview</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {isLoadingInterviewee ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ) : interviewee ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Candidate</h2>
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{interviewee.name}</p>
                  <p className="text-xs text-gray-500">{interviewee.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              No candidate selected. Please go back and select a candidate.
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Interview Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/bookings"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !interviewee}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Scheduling..." : "Schedule Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 