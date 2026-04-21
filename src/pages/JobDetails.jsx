import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Wand2, Users } from 'lucide-react';
import EditableParsedRequirements from '@/components/job/EditableParsedRequirements';
import LinkedInConnectButton from '@/components/linkedin/LinkedInConnectButton';
import SearchQueries from '@/components/job/SearchQueries';
import AddCandidates from '@/components/job/AddCandidates';
import MatchScoreCard from '@/components/candidate/MatchScoreCard';
import LatestAnalyzedCandidate from '@/components/candidate/LatestAnalyzedCandidate';
import AutoSourceCandidates from '@/components/job/AutoSourceCandidates';

const statusConfig = {
  draft: { label: 'טיוטה', className: 'bg-secondary text-secondary-foreground' },
  parsing: { label: 'מנתח...', className: 'bg-chart-4/20 text-chart-4' },
  active: { label: 'פעיל', className: 'bg-accent/20 text-accent' },
  closed: { label: 'סגור', className: 'bg-destructive/20 text-destructive' },
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => base44.entities.Job.get(id),
    refetchInterval: (query) => query.state.data?.status === 'parsing' ? 3000 : false,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => base44.entities.Candidate.filter({ job_id: id }),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasPending = Array.isArray(data) && data.some(c => c.status === 'pending' || !c.match_result);
      return hasPending ? 3000 : false;
    },
  });

  const sortedCandidates = [...candidates].sort(
    (a, b) => (b.match_result?.overall_score || 0) - (a.match_result?.overall_score || 0)
  );

  // Real-time: refresh candidates whenever any candidate is updated
  useEffect(() => {
    const unsubscribe = base44.entities.Candidate.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        queryClient.invalidateQueries({ queryKey: ['candidates', id] });
      }
    });
    return unsubscribe;
  }, [id, queryClient]);

  const handleReparse = async () => {
    await base44.functions.invoke('parseJobDescription', { jobId: id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">המשרה לא נמצאה</p>
        <Button variant="outline" onClick={() => navigate('/jobs')}>חזור למשרות</Button>
      </div>
    );
  }

  const status = statusConfig[job.status] || statusConfig.draft;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={status.className}>{status.label}</Badge>
              {job.parsed_data?.seniority && (
                <Badge variant="outline" className="capitalize">{job.parsed_data.seniority}</Badge>
              )}
              {job.parsed_data?.domain && (
                <Badge variant="outline">{job.parsed_data.domain}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LinkedInConnectButton />
          <Button variant="outline" className="gap-2" onClick={handleReparse}>
            <Wand2 className="w-4 h-4" />
            נתח מחדש
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <EditableParsedRequirements job={job} jobId={id} />
          <SearchQueries queries={job.generated_queries} jobId={id} />

          {/* Candidates */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                מועמדים
              </h3>
              <Badge variant="outline">{sortedCandidates.length}</Badge>
            </div>
            <div className="p-5 space-y-3">
              {sortedCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">אין מועמדים עדיין. הוסף מועמדים מהעמודה הימנית.</p>
              ) : (
                sortedCandidates.map((candidate, i) => (
                  <MatchScoreCard key={candidate.id} candidate={candidate} index={i} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AddCandidates jobId={id} />
          <LatestAnalyzedCandidate candidates={candidates} />
          <AutoSourceCandidates job={job} />
        </div>
      </div>
    </div>
  );
}