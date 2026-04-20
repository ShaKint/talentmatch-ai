import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GithubCandidateCard from '@/components/sourcing/GithubCandidateCard';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
  'C#', 'C++', 'Kotlin', 'Swift', 'Ruby', 'PHP', 'Scala', 'Dart'
];

const LOCATIONS = [
  'Israel', 'Tel Aviv', 'Haifa', 'Jerusalem',
  'New York', 'San Francisco', 'London', 'Berlin', 'Amsterdam'
];

export default function Sourcing() {
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    language: '',
    location: '',
    keywords: '',
    minFollowers: '',
    sort: 'followers',
  });
  const [submittedFilters, setSubmittedFilters] = useState(null);
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);

  // Jobs list for "add as candidate"
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 20),
  });
  const [selectedJobId, setSelectedJobId] = useState('');

  // Search
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['github-search', submittedFilters, page],
    queryFn: () => base44.functions.invoke('searchGithubCandidates', {
      ...submittedFilters,
      page,
    }).then(r => r.data),
    enabled: !!submittedFilters,
    keepPreviousData: true,
  });

  const handleSearch = () => {
    setPage(1);
    setSubmittedFilters({ ...filters });
  };

  // Auto-fill filters from selected job's parsed data
  const handleSearchByJob = () => {
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job?.parsed_data) return;
    const pd = job.parsed_data;
    const topSkills = (pd.must_have || []).slice(0, 3).join(' ');
    const lang = pd.must_have?.find(s =>
      LANGUAGES.map(l => l.toLowerCase()).includes(s.toLowerCase())
    ) || '';
    const newFilters = {
      keywords: topSkills,
      language: lang,
      location: 'Israel',
      minFollowers: filters.minFollowers,
      sort: 'followers',
    };
    setFilters(newFilters);
    setPage(1);
    setSubmittedFilters(newFilters);
  };

  const handleImport = async (ghUser) => {
    if (!selectedJobId) {
      toast({ title: 'בחר משרה תחילה', variant: 'destructive' });
      return;
    }
    setImporting(true);
    try {
      const profileText = [
        ghUser.name && `Name: ${ghUser.name}`,
        ghUser.bio && `Bio: ${ghUser.bio}`,
        ghUser.company && `Company: ${ghUser.company}`,
        ghUser.location && `Location: ${ghUser.location}`,
        `GitHub: ${ghUser.html_url}`,
        ghUser.followers && `Followers: ${ghUser.followers}`,
        ghUser.public_repos && `Public Repos: ${ghUser.public_repos}`,
        ghUser.top_repos?.length && `Top Repositories:\n${ghUser.top_repos.map(r => `- ${r.name} (${r.language || 'N/A'}, ⭐${r.stars}): ${r.description}`).join('\n')}`,
      ].filter(Boolean).join('\n');

      const created = await base44.entities.Candidate.create({
        job_id: selectedJobId,
        profile_url: ghUser.html_url,
        raw_text: profileText,
        status: 'pending',
      });
      await base44.functions.invoke('analyzeCandidate', { candidateId: created.id });
      toast({ title: `${ghUser.name} נוסף ונותח בהצלחה` });
    } catch (e) {
      toast({ title: 'שגיאה בייבוא', variant: 'destructive' });
    }
    setImporting(false);
  };

  const totalPages = data ? Math.ceil(Math.min(data.total_count, 100) / 12) : 0;

  return (
    <div className="min-h-screen bg-slate-50 -m-8 p-4 md:p-6 lg:p-8 text-slate-900">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 md:p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-2xl bg-white/10 p-2">
                <Github className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">GitHub Sourcing</h1>
                <p className="text-slate-300 text-sm">חפש מפתחים אמיתיים לפי טכנולוגיה, לוקיישן ופעילות</p>
              </div>
            </div>
            {data && (
              <div className="mt-4 text-sm text-slate-300">
                נמצאו <span className="text-white font-semibold">{data.total_count?.toLocaleString()}</span> מפתחים
                {data.query_used && <span> · Query: <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs">{data.query_used}</code></span>}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="rounded-3xl border-slate-200 shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">פילטרי חיפוש</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <Input
              placeholder="מילות מפתח (e.g. react machine-learning)"
              value={filters.keywords}
              onChange={e => setFilters(f => ({ ...f, keywords: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="rounded-xl xl:col-span-2"
            />
            <Select value={filters.language} onValueChange={v => setFilters(f => ({ ...f, language: v === 'any' ? '' : v }))}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="שפת תכנות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">כל השפות</SelectItem>
                {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.location} onValueChange={v => setFilters(f => ({ ...f, location: v === 'any' ? '' : v }))}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="לוקיישן" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">כל הלוקיישנים</SelectItem>
                {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.minFollowers} onValueChange={v => setFilters(f => ({ ...f, minFollowers: v === 'any' ? '' : v }))}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="מינ' followers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">ללא מגבלה</SelectItem>
                <SelectItem value="10">10+</SelectItem>
                <SelectItem value="50">50+</SelectItem>
                <SelectItem value="100">100+</SelectItem>
                <SelectItem value="500">500+</SelectItem>
                <SelectItem value="1000">1,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3 items-center">
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="rounded-xl sm:max-w-xs">
                <SelectValue placeholder="בחר משרה..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="rounded-xl px-4 border-primary/40 text-primary hover:bg-primary/5"
              onClick={handleSearchByJob}
              disabled={!selectedJobId || isLoading || isFetching}
              title="חפש אוטומטית לפי דרישות המשרה"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              חפש לפי המשרה
            </Button>
            <Button
              className="rounded-xl px-6"
              onClick={handleSearch}
              disabled={isLoading || isFetching}
            >
              {(isLoading || isFetching)
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />מחפש...</>
                : <><Search className="h-4 w-4 mr-2" />חפש</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-800 mb-6 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">שגיאה בחיפוש GitHub</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!submittedFilters && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
          <Github className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium text-slate-500">חפש מפתחים על GitHub</p>
          <p className="text-sm mt-1 max-w-xs">בחר שפת תכנות, לוקיישן או מילות מפתח ולחץ חפש</p>
        </div>
      )}

      {/* Results */}
      {data?.items?.length > 0 && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${JSON.stringify(submittedFilters)}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6"
            >
              {data.items.map((c, i) => (
                <motion.div
                  key={c.login}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GithubCandidateCard
                    candidate={c}
                    jobId={selectedJobId}
                    onImport={handleImport}
                    importing={importing}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                <ChevronRight className="h-4 w-4" />
                הקודם
              </Button>
              <span className="text-sm text-slate-500">עמוד {page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isFetching}
              >
                הבא
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* No results */}
      {submittedFilters && data?.items?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-slate-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium text-slate-500">לא נמצאו תוצאות</p>
          <p className="text-sm mt-1">נסה לשנות את הפילטרים</p>
        </div>
      )}
    </div>
  );
}