'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CSVUploadFormProps {
  tenantId: string;
}

export default function CSVUploadForm({ tenantId }: CSVUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      setError('Please select a CSV file');
      return;
    }
    
    const file = fileInputRef.current.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenantId', tenantId);
    
    try {
      const response = await fetch('/api/interviewees/upload-csv', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload CSV');
      }
      
      setSuccess(`Successfully imported ${data.count} interviewees`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh the page to show the new interviewees
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div>
      <form onSubmit={handleUpload} className="flex items-center space-x-2">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </form>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 text-sm text-green-600">
          {success}
        </div>
      )}
    </div>
  );
} 