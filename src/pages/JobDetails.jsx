import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Wand2 } from 'lucide-react';
import EditableParsedRequirements from '@/components/job/EditableParsedRequirements';
import SearchQueries from '@/components/job/SearchQueries';
import AddCandidates from '@/components/job/AddCandidates';

const statusConfig = {
  draft: { label: 'טיוטה', className: 'bg-secondary text-secondary-foreground' },
  parsing: { label: 'מנתח...', className: 'bg-chart-4/20 text-chart-4' },
  active: { label: 'פעיל', className: 'bg-accent/20 text-accent' },
  closed: { label: 'סגור', className: 'bg-destructive/20 text-destructive' },
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => base44.entities.Job.get(id),
    refetchInterval: (data) => data?.status === 'parsing' ? 3000 : false,
  });

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
        <Button variant="outline" className="gap-2 shrink-0" onClick={handleReparse}>
          <Wand2 className="w-4 h-4" />
          נתח מחדש
        </Button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <EditableParsedRequirements job={job} jobId={id} />
          {job.generated_queries && <SearchQueries queries={job.generated_queries} />}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AddCandidates jobId={id} />
          {job.raw_description && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">תיאור המשרה</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.raw_description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}