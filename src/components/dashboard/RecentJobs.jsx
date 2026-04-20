import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

const statusLabels = {
  draft: { label: 'טיוטה', className: 'bg-muted text-muted-foreground' },
  parsing: { label: 'מעבד', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  active: { label: 'פעיל', className: 'bg-accent/10 text-accent border-accent/20' },
  closed: { label: 'סגור', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function RecentJobs({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">אין משרות עדיין</p>
        <Link to="/jobs/new" className="text-primary text-sm hover:underline mt-2 inline-block">
          צור משרה ראשונה
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">משרות אחרונות</h3>
        <Link to="/jobs" className="text-primary text-sm hover:underline flex items-center gap-1">
          הצג הכל <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {jobs.slice(0, 5).map((job) => {
          const status = statusLabels[job.status] || statusLabels.draft;
          return (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.candidate_count || 0} מועמדים · {format(new Date(job.created_date), 'dd/MM/yy')}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}