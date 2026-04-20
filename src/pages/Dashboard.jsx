import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Users, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentJobs from '@/components/dashboard/RecentJobs';

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => base44.entities.Candidate.list('-created_date', 100),
  });

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const matchedCandidates = candidates.filter(c => c.match_result?.overall_score).length;
  const avgScore = matchedCandidates > 0
    ? Math.round(candidates.filter(c => c.match_result?.overall_score).reduce((sum, c) => sum + c.match_result.overall_score, 0) / matchedCandidates)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">דשבורד</h1>
          <p className="text-muted-foreground mt-1">סקירה כללית של פעילות הסורסינג</p>
        </div>
        <Link to="/jobs/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            משרה חדשה
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="סה״כ משרות" value={jobs.length} icon={Briefcase} color="primary" />
        <StatsCard title="משרות פעילות" value={activeJobs} icon={Target} color="accent" />
        <StatsCard title="מועמדים" value={candidates.length} icon={Users} color="chart3" />
        <StatsCard title="ציון ממוצע" value={avgScore > 0 ? `${avgScore}%` : '—'} icon={TrendingUp} color="chart4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentJobs jobs={jobs} />
        <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-lg">מנוע סורסינג חכם</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm">
            הזן תיאור משרה → קבל שאילתות חיפוש → הוסף מועמדים → קבל ניתוח התאמה מפורט
          </p>
          <Link to="/jobs/new">
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              התחל עכשיו
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}