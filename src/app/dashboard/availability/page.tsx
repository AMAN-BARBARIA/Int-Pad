"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format, startOfDay } from "date-fns";

const daysOfWeek = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
];

const timeSlots = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return {
    value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    label: format(new Date().setHours(hour, minute), "h:mm a"),
  };
});

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ExceptionDate {
  id: string;
  date: Date;
  isBlocked: boolean;
}

interface ApiExceptionDate {
  id: string;
  date: string;
  isBlocked: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function AvailabilityPage() {
  const { data: session } = useSession();
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [exceptionDates, setExceptionDates] = useState<ExceptionDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch availability data when the component mounts
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/availability');
        
        if (!response.ok) {
          throw new Error('Failed to fetch availability data');
        }
        
        const data = await response.json();
        
        // Transform the dates from strings to Date objects
        const formattedExceptionDates = data.exceptionDates.map((date: ApiExceptionDate) => ({
          ...date,
          date: new Date(date.date),
        }));
        
        setAvailabilitySlots(data.availabilitySlots || []);
        setExceptionDates(formattedExceptionDates || []);
      } catch (error) {
        console.error('Error fetching availability:', error);
        // If there's an error or no data, set some default values
        setAvailabilitySlots([
          { id: "1", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
          { id: "2", dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
          { id: "3", dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
          { id: "4", dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
          { id: "5", dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
        ]);
        setExceptionDates([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAvailability();
    }
  }, [session?.user?.id]);

  const handleAddAvailability = () => {
    const newSlot: AvailabilitySlot = {
      id: Date.now().toString(),
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    };
    setAvailabilitySlots([...availabilitySlots, newSlot]);
  };

  const handleRemoveAvailability = (id: string) => {
    setAvailabilitySlots(availabilitySlots.filter((slot) => slot.id !== id));
  };

  const handleAvailabilityChange = (
    id: string,
    field: "dayOfWeek" | "startTime" | "endTime",
    value: string | number
  ) => {
    setAvailabilitySlots(
      availabilitySlots.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleAddException = () => {
    if (!selectedDate) return;

    const newException: ExceptionDate = {
      id: Date.now().toString(),
      date: startOfDay(selectedDate),
      isBlocked: true,
    };

    setExceptionDates([...exceptionDates, newException]);
    setSelectedDate(null);
  };

  const handleRemoveException = (id: string) => {
    setExceptionDates(exceptionDates.filter((date) => date.id !== id));
  };

  const handleSaveAvailability = async () => {
    if (!session?.user?.id) {
      setSaveMessage({ type: 'error', text: 'You must be logged in to save availability settings.' });
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availabilitySlots,
          exceptionDates,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save availability settings');
      }
      
      const result = await response.json();
      setSaveMessage({ type: 'success', text: 'Availability settings saved successfully!' });
      console.log('Save result:', result);
    } catch (error) {
      console.error('Error saving availability:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save availability settings. Please try again.' });
    } finally {
      setIsSaving(false);
      
      // Clear the success message after 3 seconds
      if (saveMessage?.type === 'success') {
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
      }
    }
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
      <h1 className="text-2xl font-semibold mb-6">Availability Settings</h1>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {saveMessage.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Weekly Availability</h2>
          <p className="text-sm text-gray-500 mb-6">
            Set your regular weekly availability for interviews. Interviewees will be able to book slots during these times.
          </p>

          <div className="space-y-4">
            {availabilitySlots.map((slot) => (
              <div key={slot.id} className="flex items-center space-x-4">
                <div className="w-1/3">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) =>
                      handleAvailabilityChange(slot.id, "dayOfWeek", parseInt(e.target.value))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/4">
                  <select
                    value={slot.startTime}
                    onChange={(e) =>
                      handleAvailabilityChange(slot.id, "startTime", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {timeSlots.map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/4">
                  <select
                    value={slot.endTime}
                    onChange={(e) =>
                      handleAvailabilityChange(slot.id, "endTime", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {timeSlots.map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => handleRemoveAvailability(slot.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddAvailability}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Add Time Slot
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Exception Dates</h2>
          <p className="text-sm text-gray-500 mb-6">
            Block specific dates when you&apos;re not available for interviews, regardless of your weekly availability.
          </p>

          <div className="flex items-end space-x-4 mb-6">
            <div className="w-1/3">
              <label htmlFor="exception-date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="exception-date"
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleAddException}
              disabled={!selectedDate}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Add Exception
            </button>
          </div>

          {exceptionDates.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {exceptionDates.map((exception) => (
                <li key={exception.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(exception.date, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">Blocked for interviews</p>
                  </div>
                  <button
                    onClick={() => handleRemoveException(exception.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No exception dates added yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAvailability}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  );
} 