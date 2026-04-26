import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import JobPageTech from '@/components/job-preview/JobPageTech';
import JobPageBit from '@/components/job-preview/JobPageBit';

export default function JobPreview() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    base44.functions.invoke('getPublicJob', { jobId: id })
      .then(res => {
        if (!res.data || res.data.error) { setError(true); return; }
        setJob(res.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-950 text-white">
        <span className="text-4xl">🔍</span>
        <p className="text-lg">המשרה לא נמצאה או הוסרה</p>
      </div>
    );
  }

  if (job.design_template === 'bit') {
    return <JobPageBit job={job} />;
  }

  return <JobPageTech job={job} />;
}