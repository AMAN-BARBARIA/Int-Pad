"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function ConfirmationPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Booking Confirmed!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your interview has been scheduled successfully.
            </p>
            <div className="mt-6 border-t border-b border-gray-200 py-4">
              <p className="text-sm text-gray-500">
                You will receive a confirmation email shortly with all the details.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">
                  Check your calendar for the appointment details
                </span>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home {countdown > 0 && `(${countdown})`}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 