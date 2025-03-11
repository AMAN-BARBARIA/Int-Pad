"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

interface InterviewSettings {
  maxSchedulesPerDay: number;
  advanceBookingDays: number;
  meetingDuration: number;
  bufferBetweenEvents: number;
  zoomConnected: boolean;
  googleConnected: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<InterviewSettings>({
    maxSchedulesPerDay: 3,
    advanceBookingDays: 30,
    meetingDuration: 30,
    bufferBetweenEvents: 15,
    zoomConnected: false,
    googleConnected: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch settings from the API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings');
        
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        } else {
          console.error('Failed to fetch settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchSettings();
    }
  }, [session?.user?.id]);

  const handleSettingChange = (
    field: keyof InterviewSettings,
    value: number | boolean
  ) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectZoom = () => {
    // In a real app, we would redirect to Zoom OAuth flow
    window.open("https://zoom.us/oauth/authorize", "_blank");
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
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {saveMessage.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Connected Accounts</h2>
          <p className="text-sm text-gray-500 mb-6">
            Connect your accounts to sync your calendar and create meetings automatically.
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Google Calendar</h3>
                <p className="text-sm text-gray-500">
                  Sync your availability with Google Calendar and create calendar events for interviews.
                </p>
              </div>
              <div className="flex items-center">
                {settings.googleConnected ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">Not connected</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Zoom (Optional)</h3>
                <p className="text-sm text-gray-500">
                  Automatically create Zoom meetings for scheduled interviews. This is optional - interviews can be scheduled without Zoom.
                </p>
              </div>
              <div className="flex items-center">
                {settings.zoomConnected ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <button
                      onClick={handleConnectZoom}
                      className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Connect Zoom
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Interview Settings</h2>
          <p className="text-sm text-gray-500 mb-6">
            Configure your interview scheduling preferences.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="max-schedules" className="block text-sm font-medium text-gray-700">
                Maximum interviews per day
              </label>
              <select
                id="max-schedules"
                value={settings.maxSchedulesPerDay}
                onChange={(e) =>
                  handleSettingChange("maxSchedulesPerDay", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The maximum number of interviews that can be scheduled in a single day.
              </p>
            </div>

            <div>
              <label htmlFor="advance-booking" className="block text-sm font-medium text-gray-700">
                Advance booking days
              </label>
              <select
                id="advance-booking"
                value={settings.advanceBookingDays}
                onChange={(e) =>
                  handleSettingChange("advanceBookingDays", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[7, 14, 30, 60, 90].map((days) => (
                  <option key={days} value={days}>
                    {days} days
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                How far in advance interviewees can book interviews.
              </p>
            </div>

            <div>
              <label htmlFor="meeting-duration" className="block text-sm font-medium text-gray-700">
                Meeting duration
              </label>
              <select
                id="meeting-duration"
                value={settings.meetingDuration}
                onChange={(e) =>
                  handleSettingChange("meetingDuration", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[15, 30, 45, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The default duration for interview meetings.
              </p>
            </div>

            <div>
              <label htmlFor="buffer-time" className="block text-sm font-medium text-gray-700">
                Buffer between meetings
              </label>
              <select
                id="buffer-time"
                value={settings.bufferBetweenEvents}
                onChange={(e) =>
                  handleSettingChange("bufferBetweenEvents", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[0, 5, 10, 15, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Buffer time between interviews to prepare for the next one.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 