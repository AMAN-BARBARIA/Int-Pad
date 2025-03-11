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
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import AddNoteModal from '../components/AddNoteModal';
import { IntervieweeStatus, BookingStatus } from '@/types/prisma';
import { IntervieweeWithDetails, IntervieweeNote } from '@/types/interviewee';

interface Booking {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  interviewer?: { name: string | null };
  status: string;
  feedback?: string | null;
}

interface IntervieweeDetailsClientProps {
  interviewee: IntervieweeWithDetails & {
    bookings?: Booking[];
  };
  userRole: string; // ADMIN, HR, INTERVIEWER
}

export default function IntervieweeDetailsClient({ interviewee, userRole }: IntervieweeDetailsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isPassRoundModalOpen, setIsPassRoundModalOpen] = useState(false);
  const [isFailRoundModalOpen, setIsFailRoundModalOpen] = useState(false);
  const [passRoundNote, setPassRoundNote] = useState('');
  const [failRoundNote, setFailRoundNote] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };
  
  const getStatusBadgeColor = (status: IntervieweeStatus | string) => {
    switch (status) {
      case IntervieweeStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case IntervieweeStatus.CONTACTED:
        return 'bg-yellow-100 text-yellow-800';
      case IntervieweeStatus.SCHEDULED:
        return 'bg-purple-100 text-purple-800';
      case IntervieweeStatus.IN_PROGRESS:
        return 'bg-indigo-100 text-indigo-800';
      case IntervieweeStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case IntervieweeStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
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
          note,
          roundResult
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update interviewee status');
      }
      
      router.refresh(); // Refresh the page to show the updated status
    } catch (error) {
      console.error('Error updating interviewee status:', error);
      setError('Failed to update interviewee status. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsPassRoundModalOpen(false);
      setIsFailRoundModalOpen(false);
      setIsRejectModalOpen(false);
      setPassRoundNote('');
      setFailRoundNote('');
      setRejectNote('');
    }
  };
  
  const handlePassRound = () => {
    setIsPassRoundModalOpen(true);
  };
  
  const handleFailRound = () => {
    setIsFailRoundModalOpen(true);
  };
  
  const submitPassRound = () => {
    if (interviewee.currentRound === 3) {
      // If this is the final round, passing means accepting the candidate
      handleUpdateStatus(IntervieweeStatus.COMPLETED, passRoundNote, 'PASS');
    } else {
      // Otherwise, keep them in the IN_PROGRESS status but increment the round
      handleUpdateStatus(IntervieweeStatus.IN_PROGRESS, passRoundNote, 'PASS');
    }
  };
  
  const submitFailRound = () => {
    handleUpdateStatus(IntervieweeStatus.REJECTED, failRoundNote, 'FAIL');
  };
  
  const handleRejectCandidate = () => {
    setIsRejectModalOpen(true);
  };
  
  const handleScheduleInterview = () => {
    handleUpdateStatus(IntervieweeStatus.SCHEDULED);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/interviewees"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Interviewees
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header with name and status */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">{interviewee.name}</h1>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeColor(interviewee.status)}`}>
                  {interviewee.status}
                  {isInInterviewProcess && interviewee.status === IntervieweeStatus.IN_PROGRESS && (
                    <span className="ml-2">• Round {interviewee.currentRound}</span>
                  )}
                </span>
              </div>
              {(interviewee.status === IntervieweeStatus.CONTACTED || 
                interviewee.status === IntervieweeStatus.SCHEDULED || 
                interviewee.status === IntervieweeStatus.IN_PROGRESS) && (
                <Link
                  href={`/dashboard/bookings/new?candidateId=${interviewee.id}&candidateName=${interviewee.name}&candidateEmail=${interviewee.email}`}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Schedule Interview
                </Link>
              )}
            </div>
          </div>
          
          {/* Main content with three-column layout */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column - Contact & Professional Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{interviewee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900">{interviewee.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Current Location</p>
                        <p className="text-sm text-gray-900">{interviewee.currentLocation || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Current Company</p>
                        <p className="text-sm text-gray-900">{interviewee.currentCompany || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <TagIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <p className="text-sm text-gray-900">{interviewee.role?.title || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Applied On</p>
                        <p className="text-sm text-gray-900">{formatDate(interviewee.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Compensation Details</h2>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Current CTC</p>
                        <p className="text-sm text-gray-900">{interviewee.currentCTC || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Expected CTC</p>
                        <p className="text-sm text-gray-900">{interviewee.expectedCTC || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Notice Period</p>
                        <p className="text-sm text-gray-900">{interviewee.noticePeriod || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                        <p className="text-sm text-gray-900">{interviewee.yearsOfExperience || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Middle column - Skills and Resume */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg h-full">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Skills & Qualifications</h2>
                  
                  {interviewee.skills ? (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {interviewee.skills.split(',').map((skill, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-6">No skills listed</p>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Resume</h3>
                    {interviewee.resumeLink ? (
                      <a
                        href={interviewee.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        View Resume
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Resume not provided</p>
                    )}
                  </div>
                </div>
                
                {/* Notes section - scrollable */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Notes & Updates</h2>
                    {(userRole === 'ADMIN' || userRole === 'HR') && (
                      <button
                        type="button"
                        onClick={handleAddNote}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add Note
                      </button>
                    )}
                  </div>
                  
                  {interviewee.notes.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {interviewee.notes.map((note: IntervieweeNote) => {
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
                                {isSystemNote ? 'System' : note.user?.name || 'Unknown User'}
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
                    <p className="text-sm text-gray-500">No notes yet.</p>
                  )}
                </div>
              </div>
              
              {/* Right column - Interview Rounds & Actions */}
              <div className="space-y-6">
                {/* Interview Rounds & Bookings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Interview Progress</h2>
                  
                  <div className="max-h-80 overflow-y-auto pr-2">
                    {interviewee.bookings && interviewee.bookings.length > 0 ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {interviewee.bookings.map((booking, index) => (
                                <tr key={booking.id}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {format(new Date(booking.startTime), 'MMM d, h:mm a')}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                                      booking.status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Feedback section */}
                        {interviewee.bookings.some(booking => booking.feedback) && (
                          <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Interview Feedback</h3>
                            <div className="space-y-3">
                              {interviewee.bookings
                                .filter(booking => booking.feedback)
                                .map((booking, index) => (
                                  <div key={`feedback-${booking.id}`} className="bg-white p-3 rounded-md border border-gray-200">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        Round {index + 1} Feedback
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {format(new Date(booking.startTime), 'MMM d')}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{booking.feedback}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No interviews scheduled yet.</p>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {/* Different actions based on status */}
                    {interviewee.status === IntervieweeStatus.NEW && (
                      <button
                        type="button"
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        onClick={() => handleUpdateStatus(IntervieweeStatus.CONTACTED)}
                        disabled={isSubmitting}
                      >
                        Mark as Contacted
                      </button>
                    )}
                    
                    {interviewee.status === IntervieweeStatus.CONTACTED && (
                      <>
                        <button
                          type="button"
                          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          onClick={handleScheduleInterview}
                          disabled={isSubmitting}
                        >
                          Mark as Scheduled
                        </button>
                        <Link
                          href={`/dashboard/bookings/new?candidateId=${interviewee.id}&candidateName=${interviewee.name}&candidateEmail=${interviewee.email}`}
                          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Schedule Interview
                        </Link>
                      </>
                    )}
                    
                    {(interviewee.status === IntervieweeStatus.SCHEDULED || interviewee.status === IntervieweeStatus.IN_PROGRESS) && (
                      <>
                        <button
                          type="button"
                          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={handlePassRound}
                          disabled={isSubmitting}
                        >
                          {interviewee.currentRound >= 3 ? 'Mark as Completed' : 'Pass Round'}
                        </button>
                        
                        <button
                          type="button"
                          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={handleFailRound}
                          disabled={isSubmitting}
                        >
                          Reject Candidate
                        </button>
                        
                        <Link
                          href={`/dashboard/bookings/new?candidateId=${interviewee.id}&candidateName=${interviewee.name}&candidateEmail=${interviewee.email}`}
                          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Schedule Next Round
                        </Link>
                      </>
                    )}
                    
                    {interviewee.status !== IntervieweeStatus.REJECTED && interviewee.status !== IntervieweeStatus.COMPLETED && (
                      <button
                        type="button"
                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={handleRejectCandidate}
                        disabled={isSubmitting}
                      >
                        Reject Candidate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <AddNoteModal
          intervieweeId={interviewee.id}
          tenantId={interviewee.tenantId}
          onClose={() => setIsAddNoteModalOpen(false)}
          onSuccess={handleNoteSuccess}
        />
      )}

      {/* Pass Round Modal */}
      {isPassRoundModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {interviewee.currentRound >= 3 ? 'Accept Candidate' : 'Pass Interview Round'}
                </h3>
                <textarea
                  value={passRoundNote}
                  onChange={(e) => setPassRoundNote(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={4}
                  placeholder="Add a note about this decision (optional)"
                ></textarea>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={submitPassRound}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : interviewee.currentRound >= 3 ? 'Accept' : 'Pass Round'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsPassRoundModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fail Round Modal */}
      {isFailRoundModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Reject Candidate
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  This will mark the candidate as rejected. Please provide a reason for rejection.
                </p>
                <textarea
                  value={failRoundNote}
                  onChange={(e) => setFailRoundNote(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={4}
                  placeholder="Reason for rejection"
                  required
                ></textarea>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={submitFailRound}
                  disabled={isSubmitting || !failRoundNote.trim()}
                >
                  {isSubmitting ? 'Processing...' : 'Reject'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsFailRoundModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Reject Candidate
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  This will mark the candidate as rejected. Please provide a reason for rejection.
                </p>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={4}
                  placeholder="Reason for rejection"
                  required
                ></textarea>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleUpdateStatus(IntervieweeStatus.REJECTED, rejectNote)}
                  disabled={isSubmitting || !rejectNote.trim()}
                >
                  {isSubmitting ? 'Processing...' : 'Reject'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 