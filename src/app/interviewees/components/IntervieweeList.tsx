'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntervieweeStatus } from '@/types/prisma';
import { IntervieweeWithDetails } from '@/types/interviewee';
import AddNoteModal from './AddNoteModal';

interface IntervieweeListProps {
  interviewees: IntervieweeWithDetails[];
  tenantId?: string;
}

export default function IntervieweeList({ interviewees, tenantId }: IntervieweeListProps) {
  const router = useRouter();
  const [selectedInterviewee, setSelectedInterviewee] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
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
      case IntervieweeStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case IntervieweeStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleStatusChange = async (intervieweeId: string, newStatus: IntervieweeStatus) => {
    try {
      const response = await fetch(`/api/interviewees/${intervieweeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };
  
  const openNoteModal = (intervieweeId: string) => {
    setSelectedInterviewee(intervieweeId);
    setIsNoteModalOpen(true);
  };
  
  const closeNoteModal = () => {
    setIsNoteModalOpen(false);
    setSelectedInterviewee(null);
  };
  
  const handleViewDetails = (intervieweeId: string) => {
    router.push(`/interviewees/${intervieweeId}`);
  };
  
  return (
    <div className="overflow-x-auto">
      {interviewees.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No interviewees found. Upload a CSV to add interviewees.</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Company
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notice Period
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Round
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {interviewees.map((interviewee) => (
              <tr key={interviewee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        <button 
                          onClick={() => handleViewDetails(interviewee.id)}
                          className="hover:underline text-left"
                        >
                          {interviewee.name}
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">{interviewee.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{interviewee.currentCompany || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{interviewee.yearsOfExperience || '-'} years</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{interviewee.noticePeriod || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{interviewee.role?.title || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={interviewee.status}
                    onChange={(e) => handleStatusChange(interviewee.id, e.target.value as IntervieweeStatus)}
                    className={`text-xs rounded-full px-2 py-1 ${getStatusBadgeColor(interviewee.status)}`}
                  >
                    <option value={IntervieweeStatus.NEW}>New</option>
                    <option value={IntervieweeStatus.CONTACTED}>Contacted</option>
                    <option value={IntervieweeStatus.SCHEDULED}>Scheduled</option>
                    <option value={IntervieweeStatus.IN_PROGRESS}>In Progress</option>
                    <option value={IntervieweeStatus.REJECTED}>Rejected</option>
                    <option value={IntervieweeStatus.COMPLETED}>Completed</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {interviewee.currentRound === 0 ? 'Not Started' : `Round ${interviewee.currentRound}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openNoteModal(interviewee.id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => handleViewDetails(interviewee.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {isNoteModalOpen && selectedInterviewee && (
        <AddNoteModal
          intervieweeId={selectedInterviewee}
          tenantId={tenantId || interviewees[0]?.tenantId || ''}
          onClose={closeNoteModal}
          onSuccess={() => {
            closeNoteModal();
            router.refresh();
          }}
        />
      )}
    </div>
  );
} 