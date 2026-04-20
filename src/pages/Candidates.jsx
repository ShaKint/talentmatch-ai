import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MatchScoreCard from '@/components/candidate/MatchScoreCard';

export default function Candidates() {
  const [search, setSearch] = useState('');
  const [filterJob, setFilterJob] = useState('all');

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => base44.entities.Candidate.list('-created_date', 200),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
  });

  const filtered = candidates
    .filter(c => {
      if (filterJob !== 'all' && c.job_id !== filterJob) return false;
      if (search) {
        const s = search.toLowerCase();
        const name = c.parsed_profile?.name?.toLowerCase() || '';
        const headline = c.parsed_profile?.headline?.toLowerCase() || '';
        return name.includes(s) || headline.includes(s);
      }
      return true;
    })
    .sort((a, b) => (b.match_result?.overall_score || 0) - (a.match_result?.overall_score || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">מועמדים</h1>
        <p className="text-muted-foreground mt-1">כל המועמדים שנותחו מכל המשרות</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חפש מועמד..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterJob} onValueChange={setFilterJob}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="כל המשרות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המשרות</SelectItem>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">אין מועמדים</h3>
          <p className="text-muted-foreground">
            {candidates.length === 0 ? 'הוסף מועמדים ממשרה כדי לראות תוצאות' : 'אין תוצאות לחיפוש'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((candidate, idx) => (
            <MatchScoreCard key={candidate.id} candidate={candidate} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}