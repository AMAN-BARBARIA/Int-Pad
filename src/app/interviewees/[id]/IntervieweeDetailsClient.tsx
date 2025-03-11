'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import AddNoteModal from '../components/AddNoteModal';
import { IntervieweeStatus } from '@/types/prisma';

// Define proper types instead of using 'any'
interface Note {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  interviewer: {
    id: string;
    name: string;
  };
  feedback?: string;
}

interface Role {
  id: string;
  title: string;
}

interface Interviewee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeLink?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  skills?: string;
  currentCTC?: string;
  expectedCTC?: string;
  noticePeriod?: string;
  currentLocation?: string;
  status: string;
  currentRound: number;
  role?: Role;
  notes: Note[];
  bookings: Booking[];
}

interface IntervieweeDetailsClientProps {
  interviewee: Interviewee;
  userRole: string; // ADMIN, HR, INTERVIEWER
}

export default function IntervieweeDetailsClient({ interviewee, userRole }: IntervieweeDetailsClientProps) {
  const router = useRouter();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPassRoundModalOpen, setIsPassRoundModalOpen] = useState(false);
  const [isFailRoundModalOpen, setIsFailRoundModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format status for display
  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    CONTACTED: "bg-yellow-100 text-yellow-800",
    SCHEDULED: "bg-purple-100 text-purple-800",
    IN_PROGRESS: "bg-orange-100 text-orange-800",
    REJECTED: "bg-red-100 text-red-800",
    ACCEPTED: "bg-green-100 text-green-800",
    ON_HOLD: "bg-gray-100 text-gray-800"
  };
  
  const statusColor = statusColors[interviewee.status] || "bg-gray-100 text-gray-800";

  // Check if the candidate is in the interview process (has rounds)
  const isInInterviewProcess = interviewee.currentRound > 0;

  const handleAddNote = () => {
    setIsAddNoteModalOpen(true);
  };

  const handleNoteSuccess = () => {
    setIsAddNoteModalOpen(false);
    router.refresh(); // Refresh the page to show the new note
  };

  // Update status with optional note and round result
  const handleUpdateStatus = async (status: string, note?: string, roundResult?: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/interviewees/${interviewee.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          note: note || undefined,
          roundResult: roundResult || undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      router.refresh(); // Refresh the page to show the updated status
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsStatusModalOpen(false);
      setIsPassRoundModalOpen(false);
      setIsFailRoundModalOpen(false);
      setNoteContent('');
    }
  };

  // Handle passing a round
  const handlePassRound = () => {
    setIsPassRoundModalOpen(true);
  };

  // Handle failing a round (rejecting)
  const handleFailRound = () => {
    setIsFailRoundModalOpen(true);
  };

  // Submit pass round with note
  const submitPassRound = () => {
    // If this is the final round (3), passing means accepting the candidate
    if (interviewee.currentRound >= 3) {
      handleUpdateStatus(IntervieweeStatus.ACCEPTED, noteContent, 'PASS');
    } else {
      // Otherwise, keep in progress but increment the round
      handleUpdateStatus(interviewee.status, noteContent, 'PASS');
    }
  };

  // Submit fail round with note (reject)
  const submitFailRound = () => {
    handleUpdateStatus(IntervieweeStatus.REJECTED, noteContent, 'FAIL');
  };

  const handleRejectCandidate = () => {
    setIsFailRoundModalOpen(true);
  };

  const handleScheduleInterview = () => {
    router.push(`/bookings/new?intervieweeId=${interviewee.id}`);
  };

  // Main component render
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/interviewees" 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Interviewees
          </Link>
        </div>
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{interviewee.name}</h1>
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {interviewee.status.replace(/_/g, " ")}
              </span>
              
              {isInInterviewProcess && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Round {interviewee.currentRound}
                </span>
              )}
              
              {interviewee.role && (
                <span className="ml-2 text-sm text-gray-500">
                  {interviewee.role.title}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Interview Progress Bar - Show only if in interview process */}
        {isInInterviewProcess && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Interview Progress</h2>
            <div className="bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((interviewee.currentRound / 3) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <div className={interviewee.currentRound >= 1 ? "font-medium text-indigo-600" : ""}>Round 1</div>
              <div className={interviewee.currentRound >= 2 ? "font-medium text-indigo-600" : ""}>Round 2</div>
              <div className={interviewee.currentRound >= 3 ? "font-medium text-indigo-600" : ""}>Round 3</div>
              <div className={interviewee.status === "ACCEPTED" ? "font-medium text-green-600" : ""}>Accepted</div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Contact & Professional Details */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{interviewee.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                {interviewee.phone && (
                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interviewee.phone}</p>
                      <p className="text-xs text-gray-500">Phone</p>
                    </div>
                  </div>
                )}
                {interviewee.currentLocation && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interviewee.currentLocation}</p>
                      <p className="text-xs text-gray-500">Location</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h2>
              <div className="space-y-3">
                {interviewee.currentCompany && (
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interviewee.currentCompany}</p>
                      <p className="text-xs text-gray-500">Current Company</p>
                    </div>
                  </div>
                )}
                {interviewee.yearsOfExperience !== null && (
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interviewee.yearsOfExperience} years</p>
                      <p className="text-xs text-gray-500">Experience</p>
                    </div>
                  </div>
                )}
                {interviewee.noticePeriod && (
                  <div className="flex items-start">
                    <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interviewee.noticePeriod}</p>
                      <p className="text-xs text-gray-500">Notice Period</p>
                    </div>
                  </div>
                )}
                {(interviewee.currentCTC || interviewee.expectedCTC) && (
                  <div className="flex items-start">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      {interviewee.currentCTC && (
                        <p className="text-sm font-medium text-gray-900">Current: {interviewee.currentCTC}</p>
                      )}
                      {interviewee.expectedCTC && (
                        <p className="text-sm font-medium text-gray-900">Expected: {interviewee.expectedCTC}</p>
                      )}
                      <p className="text-xs text-gray-500">Compensation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {interviewee.resumeLink && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Resume</h2>
                <a 
                  href={interviewee.resumeLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
                  View Resume
                </a>
              </div>
            )}
          </div>
          
          {/* Middle column - Skills & Notes */}
          <div className="space-y-6">
            {interviewee.skills && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {interviewee.skills.split(',').map((skill: string, index: number) => {
                    const trimmedSkill = skill.trim().toLowerCase();
                    let icon = <TagIcon className="h-3 w-3 mr-1" />;
                    
                    // Add icons for common skills
                    if (trimmedSkill.includes('react')) {
                      icon = <span className="mr-1 text-blue-500">⚛️</span>;
                    } else if (trimmedSkill.includes('node')) {
                      icon = <span className="mr-1 text-green-500">🟢</span>;
                    } else if (trimmedSkill.includes('javascript') || trimmedSkill.includes('js')) {
                      icon = <span className="mr-1 text-yellow-500">𝐉𝐒</span>;
                    } else if (trimmedSkill.includes('typescript') || trimmedSkill.includes('ts')) {
                      icon = <span className="mr-1 text-blue-500">𝐓𝐒</span>;
                    } else if (trimmedSkill.includes('python')) {
                      icon = <span className="mr-1">🐍</span>;
                    } else if (trimmedSkill.includes('java')) {
                      icon = <span className="mr-1">☕</span>;
                    } else if (trimmedSkill.includes('mongo')) {
                      icon = <span className="mr-1 text-green-500">🍃</span>;
                    } else if (trimmedSkill.includes('sql')) {
                      icon = <span className="mr-1">🗄️</span>;
                    } else if (trimmedSkill.includes('aws')) {
                      icon = <span className="mr-1">☁️</span>;
                    } else if (trimmedSkill.includes('docker')) {
                      icon = <span className="mr-1 text-blue-500">🐳</span>;
                    } else if (trimmedSkill.includes('git')) {
                      icon = <span className="mr-1 text-orange-500">🔄</span>;
                    } else if (trimmedSkill.includes('html')) {
                      icon = <span className="mr-1 text-orange-500">🌐</span>;
                    } else if (trimmedSkill.includes('css')) {
                      icon = <span className="mr-1 text-blue-500">🎨</span>;
                    }
                    
                    return (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {icon}
                        {skill.trim()}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Activity Log</h2>
                <button 
                  onClick={handleAddNote}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Add Note
                </button>
              </div>
              
              {interviewee.notes.length > 0 ? (
                <div className="space-y-4">
                  {interviewee.notes.map((note: Note) => {
                    const isSystemNote = note.content.startsWith('[SYSTEM]');
                    return (
                      <div 
                        key={note.id} 
                        className={`p-3 rounded-md border ${
                          isSystemNote 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {isSystemNote ? 'System' : note.user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {isSystemNote ? note.content.replace('[SYSTEM] ', '') : note.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No activity yet</p>
              )}
            </div>
          </div>
          
          {/* Right column - Interview History & Actions */}
          <div className="space-y-6">
            {/* Interview History */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Interview History</h2>
              {interviewee.bookings && interviewee.bookings.length > 0 ? (
                <div className="space-y-4">
                  {interviewee.bookings.map((booking: Booking) => (
                    <div key={booking.id} className="border-l-4 border-indigo-400 pl-3 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.title || "Interview"}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(booking.startTime), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          <p className="text-xs text-gray-500">
                            with {booking.interviewer?.name || "Interviewer"}
                          </p>
                        </div>
                        <div>
                          {booking.status === 'completed' ? (
                            booking.feedback?.includes('pass') ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      {booking.feedback && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Feedback:</p>
                          <p className="text-sm text-gray-700">{booking.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    {interviewee.status === 'SCHEDULED' ? 
                      'Candidate has been scheduled but has not booked an interview slot yet.' :
                      'No interviews scheduled yet'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
               
              {/* Only show actions for HR and ADMIN users */}
              {(userRole === 'HR' || userRole === 'ADMIN') ? (
                <div className="space-y-2">
                  {/* Show different primary actions based on current state */}
                  <div className="flex flex-col space-y-2 mb-4 border-b border-gray-200 pb-4">
                    <h3 className="text-sm font-medium text-gray-700">Primary Actions</h3>
                    
                    {interviewee.status === 'NEW' && (
                      <button 
                        onClick={() => handleUpdateStatus('CONTACTED')}
                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium flex items-center justify-center"
                      >
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        Mark as Contacted
                      </button>
                    )}
                    
                    {interviewee.status === 'CONTACTED' && (
                      <button 
                        onClick={() => handleUpdateStatus('SCHEDULED')}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center justify-center"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Mark as Scheduled
                      </button>
                    )}
                    
                    {(interviewee.status === 'SCHEDULED' || interviewee.status === 'CONTACTED') && (
                      <button 
                        onClick={handleScheduleInterview}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center justify-center"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </button>
                    )}
                    
                    {interviewee.status === 'IN_PROGRESS' && (
                      <>
                        {/* Pass/Fail buttons for IN_PROGRESS status */}
                        <button 
                          onClick={handlePassRound}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center justify-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Pass Round {interviewee.currentRound}
                          {interviewee.currentRound >= 3 ? " (Accept)" : ""}
                        </button>
                        
                        <button 
                          onClick={handleFailRound}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center justify-center"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Fail Round {interviewee.currentRound} (Reject)
                        </button>
                      </>
                    )}
                    
                    {interviewee.status !== 'REJECTED' && interviewee.status !== 'IN_PROGRESS' && (
                      <button 
                        onClick={handleRejectCandidate}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center justify-center"
                      >
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Reject Candidate
                      </button>
                    )}
                  </div>
                  
                  {/* Common actions available for all statuses */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">General Actions</h3>
                    
                    {/* Schedule Interview button for IN_PROGRESS status */}
                    {interviewee.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={handleScheduleInterview}
                        className="w-full px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50 text-sm font-medium flex items-center justify-center"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule Next Interview
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setIsStatusModalOpen(true)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                    >
                      Update Status
                    </button>
                    
                    <button 
                      onClick={handleAddNote}
                      className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-600">
                  Only HR and Admin users can perform actions on candidates.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <AddNoteModal
          intervieweeId={interviewee.id}
          onClose={() => setIsAddNoteModalOpen(false)}
          onSuccess={handleNoteSuccess}
        />
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
            
            <div className="space-y-4">
              {Object.values(IntervieweeStatus)
                .filter(status => status !== 'ACCEPTED') // Remove ACCEPTED as it's only achieved through rounds
                .map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      status === interviewee.status
                        ? 'bg-indigo-100 border border-indigo-300 text-indigo-800'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={isSubmitting}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
            </div>
            
            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass Round Modal */}
      {isPassRoundModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {interviewee.currentRound >= 3 
                ? 'Accept Candidate' 
                : `Pass Round ${interviewee.currentRound}`}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {interviewee.currentRound >= 3 
                  ? 'This is the final round. Passing will mark the candidate as ACCEPTED.' 
                  : `This will advance the candidate to round ${interviewee.currentRound + 1}.`}
              </p>
              
              <label htmlFor="passNote" className="block text-sm font-medium text-gray-700 mb-1">
                Add Note (Optional)
              </label>
              <textarea
                id="passNote"
                rows={4}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm min-h-[120px]"
                placeholder="Add feedback or notes about this decision..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsPassRoundModalOpen(false);
                  setNoteContent('');
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitPassRound}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    {interviewee.currentRound >= 3 ? 'Accept Candidate' : 'Pass Round'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Round Modal */}
      {isFailRoundModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isInInterviewProcess 
                ? `Fail Round ${interviewee.currentRound}` 
                : 'Reject Candidate'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                This will mark the candidate as REJECTED. This action cannot be undone.
              </p>
              
              <label htmlFor="failNote" className="block text-sm font-medium text-gray-700 mb-1">
                Add Rejection Note (Required)
              </label>
              <textarea
                id="failNote"
                rows={4}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm min-h-[120px]"
                placeholder="Please provide a reason for rejection..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsFailRoundModalOpen(false);
                  setNoteContent('');
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitFailRound}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center"
                disabled={isSubmitting || !noteContent.trim()}
              >
                {isSubmitting ? 'Processing...' : (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject Candidate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 