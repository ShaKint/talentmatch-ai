import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import ParsedRequirements from '@/components/job/ParsedRequirements';
import SearchQueries from '@/components/job/SearchQueries';
import AddCandidates from '@/components/job/AddCandidates';
import MatchScoreCard from '@/components/candidate/MatchScoreCard';

export default function JobDetails() {
  const navigate = useNavigate();
  const { id: jobId } = useParams();

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => base44.entities.Job.get(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'parsing' ? 2000 : false;
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => base44.entities.Candidate.filter({ job_id: jobId }, '-created_date', 100),
    enabled: !!jobId,
    refetchInterval: 5000,
  });

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">משרה לא נמצאה</p>
      </div>
    );
  }

  const sortedCandidates = [...candidates].sort((a, b) =>
    (b.match_result?.overall_score || 0) - (a.match_result?.overall_score || 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה למשרות
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{job.title}</h1>
          {job.status === 'parsing' && (
            <div className="flex items-center gap-2 text-chart-4 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              מנתח...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ParsedRequirements parsedData={job.parsed_data} />
          <SearchQueries queries={job.generated_queries} />
        </div>

        <div className="space-y-6">
          <AddCandidates jobId={job.id} />

          {sortedCandidates.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                מועמדים ({sortedCandidates.length})
              </h3>
              <div className="space-y-4">
                {sortedCandidates.map((candidate, idx) => (
                  <MatchScoreCard key={candidate.id} candidate={candidate} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}