"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, startOfDay, isSameDay } from "date-fns";
import { CalendarIcon, ClockIcon, UserIcon } from "@heroicons/react/24/outline";

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
}

interface BookingFormData {
  name: string;
  email: string;
  selectedSlotId: string | null;
}

interface InterviewerInfo {
  name: string;
  email: string;
  meetingDuration: number;
}

interface AvailableSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    selectedSlotId: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewer, setInterviewer] = useState<InterviewerInfo | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch available slots when the component mounts or when the userId changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        
        const response = await fetch(`/api/available-slots/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch available slots");
        }
        
        const data = await response.json();
        
        // Transform the dates from strings to Date objects
        const formattedSlots = data.availableSlots.map((slot: AvailableSlot) => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        }));
        
        setAvailableSlots(formattedSlots);
        setInterviewer(data.interviewer);
        
        // Extract unique dates from the available slots
        const uniqueDates = Array.from(
          new Set(
            formattedSlots.map((slot: TimeSlot) => 
              format(slot.startTime, "yyyy-MM-dd")
            )
          )
        ).map((dateStr) => new Date(dateStr as string));
        
        setAvailableDates(uniqueDates);
        
        // Set the selected date to the first available date if there are any
        if (uniqueDates.length > 0) {
          setSelectedDate(startOfDay(uniqueDates[0]));
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
        setErrorMessage("Failed to load available time slots. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchAvailableSlots();
    }
  }, [userId]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(startOfDay(date));
  };

  const handleSlotSelect = (slotId: string) => {
    setFormData({
      ...formData,
      selectedSlotId: slotId,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selectedSlotId || !formData.name || !formData.email) {
      alert("Please fill in all fields and select a time slot.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedSlot = availableSlots.find(
        (slot) => slot.id === formData.selectedSlotId
      );
      
      if (!selectedSlot) {
        throw new Error("Selected time slot not found");
      }
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewerId: userId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          intervieweeName: formData.name,
          intervieweeEmail: formData.email,
          title: `Interview with ${formData.name}`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to book interview");
      }
      
      // Redirect to confirmation page
      router.push("/book/confirmation");
    } catch (error) {
      console.error("Error booking interview:", error);
      alert(`Failed to book interview: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSlots = availableSlots.filter((slot) => 
    isSameDay(slot.startTime, selectedDate)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Error
            </h1>
            <p className="mt-3 text-xl text-red-600">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              No Available Time Slots
            </h1>
            <p className="mt-3 text-xl text-gray-500">
              {interviewer?.name || "The interviewer"} doesn&apos;t have any available time slots at the moment.
            </p>
            <p className="mt-2 text-gray-500">
              Please check back later or contact them directly to schedule an interview.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Schedule an Interview
          </h1>
          {interviewer && (
            <p className="mt-3 text-xl text-gray-500">
              with {interviewer.name}
            </p>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h2 className="text-lg font-medium text-gray-900">Select a Date</h2>
                <div className="mt-4 space-y-2">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateChange(date)}
                      className={`w-full px-4 py-2 text-left rounded-md ${
                        isSameDay(date, selectedDate)
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">
                        {format(date, "EEEE")}
                      </div>
                      <div className="text-sm">
                        {format(date, "MMMM d, yyyy")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h2 className="text-lg font-medium text-gray-900">Select a Time</h2>
                {filteredSlots.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot.id)}
                        className={`px-4 py-3 text-center rounded-md ${
                          formData.selectedSlotId === slot.id
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {format(slot.startTime, "h:mm a")}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center py-8 bg-gray-50 rounded-md">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No available times</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      There are no available time slots for this date. Please select another date.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {formData.selectedSlotId && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">
                          {format(
                            availableSlots.find((slot) => slot.id === formData.selectedSlotId)?.startTime || new Date(),
                            "EEEE, MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">
                          {format(
                            availableSlots.find((slot) => slot.id === formData.selectedSlotId)?.startTime || new Date(),
                            "h:mm a"
                          )} - {format(
                            availableSlots.find((slot) => slot.id === formData.selectedSlotId)?.endTime || new Date(),
                            "h:mm a"
                          )}
                        </span>
                      </div>
                      {interviewer && (
                        <div className="flex items-center mt-2">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">
                            {interviewer.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Scheduling..." : "Schedule Interview"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 