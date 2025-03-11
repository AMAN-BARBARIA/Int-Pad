'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IntervieweeStatus } from '@/types/prisma';

interface JobRole {
  id: string;
  title: string;
}

interface FilterBarProps {
  roles: JobRole[];
}

export default function FilterBar({ roles }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState(searchParams.get('name') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [round, setRound] = useState(searchParams.get('round') || '');
  const [roleId, setRoleId] = useState(searchParams.get('roleId') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (name) params.set('name', name);
    if (status) params.set('status', status);
    if (round) params.set('round', round);
    if (roleId) params.set('roleId', roleId);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    
    router.push(`/interviewees?${params.toString()}`);
  };
  
  const resetFilters = () => {
    setName('');
    setStatus('');
    setRound('');
    setRoleId('');
    setSortBy('');
    setSortOrder('desc');
    router.push('/interviewees');
  };
  
  // Apply filters when user presses Enter in the name input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-2">Filter Interviewees</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name or Email
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name or email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value={IntervieweeStatus.NEW}>New</option>
            <option value={IntervieweeStatus.CONTACTED}>Contacted</option>
            <option value={IntervieweeStatus.SCHEDULED}>Scheduled</option>
            <option value={IntervieweeStatus.IN_PROGRESS}>In Progress</option>
            <option value={IntervieweeStatus.ACCEPTED}>Accepted</option>
            <option value={IntervieweeStatus.REJECTED}>Rejected</option>
            <option value={IntervieweeStatus.ON_HOLD}>On Hold</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="round" className="block text-sm font-medium text-gray-700 mb-1">
            Interview Round
          </label>
          <select
            id="round"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Rounds</option>
            <option value="0">Not Started</option>
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
            <option value="3">Round 3</option>
            <option value="4">Round 4</option>
            <option value="5">Round 5</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
            Job Role
          </label>
          <select
            id="roleId"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Created Date</option>
            <option value="name">Name</option>
            <option value="currentCompany">Current Company</option>
            <option value="yearsOfExperience">Years of Experience</option>
            <option value="noticePeriod">Notice Period</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <button
          onClick={resetFilters}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Reset Filters
        </button>
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
} 