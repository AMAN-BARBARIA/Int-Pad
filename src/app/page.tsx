import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <header className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-indigo-600">InterviewScheduler</div>
          <div className="space-x-4">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 text-indigo-600 hover:text-indigo-800"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </header>

        <main className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Streamline Your Interview Scheduling Process
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect your Google Calendar and Zoom, set your availability, and let candidates book interview slots that work for everyone.
            </p>
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Start Scheduling <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white p-8 rounded-lg shadow-xl">
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-medium">Technical Interview</div>
                  <div className="text-sm text-gray-500">30 min</div>
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-2 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
                    Monday, June 10 • 10:00 AM
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
                    Monday, June 10 • 2:00 PM
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
                    Tuesday, June 11 • 11:00 AM
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">
                Example booking interface for candidates
              </div>
            </div>
          </div>
        </main>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 font-bold text-xl mb-4">1. Connect</div>
              <p className="text-gray-600">Connect your Google Calendar and Zoom accounts to sync your schedule and create meetings automatically.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 font-bold text-xl mb-4">2. Configure</div>
              <p className="text-gray-600">Set your availability, buffer times, and how far in advance candidates can book interviews.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 font-bold text-xl mb-4">3. Share</div>
              <p className="text-gray-600">Share your booking link with candidates and let them choose a time that works for them.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
