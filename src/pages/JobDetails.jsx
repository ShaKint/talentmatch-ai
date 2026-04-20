import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Wand2, Link as LinkIcon, Users, BadgePercent, Briefcase,
  ChevronRight, Copy, Sparkles, CheckCircle2, AlertCircle, Filter,
  Target, BrainCircuit, ArrowRight, Loader2, Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

// ── small helpers ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const tone =
    score >= 88 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 75 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <Badge className={`rounded-full px-3 py-1 text-xs font-semibold border ${tone}`}>
      {score}% match
    </Badge>
  );
}

function VerdictBadge({ level }) {
  const map = {
    strong_fit: { label: 'Strong Fit', cls: 'bg-green-100 text-green-700 border-green-200' },
    good_fit:   { label: 'Good Fit',   cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    partial_fit:{ label: 'Partial Fit',cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    weak_fit:   { label: 'Weak Fit',   cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const cfg = map[level] || map.partial_fit;
  return <Badge className={`rounded-full border ${cfg.cls}`}>{cfg.label}</Badge>;
}

function QueryCard({ title, query, searchUrl }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>
          <div className="flex items-center gap-1">
            {searchUrl && (
              <Button
                variant="outline" size="sm" className="rounded-xl text-xs"
                onClick={() => window.open(searchUrl, '_blank')}
              >
                פתח
              </Button>
            )}
            <Button
              variant="outline" size="sm" className="rounded-xl"
              onClick={async () => {
                await navigator.clipboard.writeText(query);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 leading-6 break-words font-mono">
          {query}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownBar({ label, value }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function JobDetails() {
  const navigate = useNavigate();
  const { id: jobId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [candidateLinks, setCandidateLinks] = useState('');
  const [profileText, setProfileText] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // ── data ──
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => base44.entities.Job.get(jobId),
    enabled: !!jobId,
    refetchInterval: (q) => q.state.data?.status === 'parsing' ? 2000 : false,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => base44.entities.Candidate.filter({ job_id: jobId }, '-created_date', 100),
    enabled: !!jobId,
    refetchInterval: 5000,
  });

  const sortedCandidates = useMemo(() =>
    [...candidates].sort((a, b) => (b.match_result?.overall_score || 0) - (a.match_result?.overall_score || 0)),
    [candidates]
  );

  const selected = selectedCandidate || sortedCandidates[0] || null;

  // ── add candidates mutation ──
  const addMutation = useMutation({
    mutationFn: async (items) => {
      const results = [];
      for (const c of items) {
        const created = await base44.entities.Candidate.create({
          job_id: jobId,
          profile_url: c.url || '',
          raw_text: c.text || '',
          status: 'pending',
        });
        await base44.functions.invoke('analyzeCandidate', { candidateId: created.id });
        results.push(created);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: `${results.length} מועמדים נוספו ונותחו` });
      setCandidateLinks('');
      setProfileText('');
    },
  });

  const handleAddByUrls = () => {
    const list = candidateLinks.split('\n').map(u => u.trim()).filter(Boolean);
    if (list.length) addMutation.mutate(list.map(url => ({ url })));
  };

  const handleAddByText = () => {
    if (profileText.trim()) addMutation.mutate([{ text: profileText }]);
  };

  // ── stat cards ──
  const strongMatches = candidates.filter(c => c.match_result?.recommendation_level === 'strong_fit').length;
  const statCards = [
    { label: 'Boolean queries', value: job?.generated_queries?.linkedin_boolean?.length || 0, icon: Search },
    { label: 'X-Ray queries',   value: job?.generated_queries?.google_xray?.length || 0,     icon: BrainCircuit },
    { label: 'Profiles analyzed', value: candidates.filter(c => c.status === 'matched').length, icon: Users },
    { label: 'Strong matches',  value: strongMatches,                                          icon: BadgePercent },
  ];

  // ── loading ──
  if (jobLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );
  if (!job) return <div className="text-center py-16 text-slate-500">משרה לא נמצאה</div>;

  const queries = job.generated_queries || {};
  const parsed  = job.parsed_data || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 -m-8 p-4 md:p-6 lg:p-8">

      {/* ── hero header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 md:p-8 text-white">
            <button
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה למשרות
            </button>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recruiting Copilot
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{job.title}</h1>
                {parsed.seniority && (
                  <p className="text-slate-300 text-sm">
                    {parsed.seniority} · {parsed.domain || ''} {parsed.management_required ? '· ניהול נדרש' : ''}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:w-[520px]">
                {statCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <Icon className="h-4 w-4 text-slate-100 mb-3" />
                      <div className="text-xl font-semibold">{item.value}</div>
                      <div className="mt-1 text-xs text-slate-300">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── body ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

        {/* LEFT: inputs */}
        <div className="xl:col-span-5 space-y-6">

          {/* Parsed requirements */}
          {parsed.must_have && (
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2"><Wand2 className="h-5 w-5" /></div>
                  <div>
                    <CardTitle>Parsed Requirements</CardTitle>
                    <CardDescription>AI extracted from job description</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Must Have</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.must_have.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-900 text-white text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                {parsed.nice_to_have?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nice to Have</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.nice_to_have.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 border border-slate-200 text-slate-700 text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {parsed.alternative_titles?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Alternative Titles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.alternative_titles.map((t, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fit weights */}
          {parsed.weights && (
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2"><Filter className="h-5 w-5" /></div>
                  <div>
                    <CardTitle>Fit Weights</CardTitle>
                    <CardDescription>Scoring weights auto-configured for this role</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(parsed.weights).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-700">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{value}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add candidates */}
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-2"><LinkIcon className="h-5 w-5" /></div>
                <div>
                  <CardTitle>Candidate Profile Links</CardTitle>
                  <CardDescription>Paste LinkedIn URLs or full profile text for analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="urls">
                <TabsList className="grid grid-cols-2 rounded-2xl bg-slate-100 mb-4">
                  <TabsTrigger value="urls" className="rounded-2xl">URLs</TabsTrigger>
                  <TabsTrigger value="text" className="rounded-2xl">Profile Text</TabsTrigger>
                </TabsList>
                <TabsContent value="urls" className="space-y-3">
                  <Textarea
                    value={candidateLinks}
                    onChange={(e) => setCandidateLinks(e.target.value)}
                    className="min-h-[160px] rounded-2xl font-mono text-sm"
                    placeholder={"https://linkedin.com/in/name-1\nhttps://linkedin.com/in/name-2"}
                  />
                  <Button
                    className="w-full rounded-2xl h-11"
                    onClick={handleAddByUrls}
                    disabled={!candidateLinks.trim() || addMutation.isPending}
                  >
                    {addMutation.isPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />מנתח...</>
                      : <><Target className="mr-2 h-4 w-4" />Analyze Candidates</>}
                  </Button>
                </TabsContent>
                <TabsContent value="text" className="space-y-3">
                  <Textarea
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    className="min-h-[200px] rounded-2xl text-sm"
                    placeholder="הדבק טקסט מפרופיל LinkedIn — שם, כותרת, ניסיון, כישורים..."
                  />
                  <Button
                    className="w-full rounded-2xl h-11"
                    onClick={handleAddByText}
                    disabled={!profileText.trim() || addMutation.isPending}
                  >
                    {addMutation.isPending
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />מנתח...</>
                      : <><Upload className="mr-2 h-4 w-4" />Analyze Profile</>}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: queries + results */}
        <div className="xl:col-span-7 space-y-6">

          {/* Search queries */}
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Generated Search Queries</CardTitle>
              <CardDescription>Use multiple queries — start broad, then narrow by signal quality.</CardDescription>
            </CardHeader>
            <CardContent>
              {job.status === 'parsing' ? (
                <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>מייצר שאילתות חיפוש...</span>
                </div>
              ) : !queries.linkedin_boolean ? (
                <div className="text-center py-8 text-slate-400">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">השאילתות ייוצרו אוטומטית לאחר ניתוח המשרה</p>
                </div>
              ) : (
                <Tabs defaultValue="linkedin">
                  <TabsList className="grid grid-cols-2 rounded-2xl bg-slate-100 mb-4">
                    <TabsTrigger value="linkedin" className="rounded-2xl">LinkedIn Boolean</TabsTrigger>
                    <TabsTrigger value="xray" className="rounded-2xl">Google X-Ray</TabsTrigger>
                  </TabsList>
                  <TabsContent value="linkedin">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {queries.linkedin_boolean.map((q, i) => (
                        <QueryCard
                          key={i}
                          title={q.label || `Query ${i + 1}`}
                          query={q.query}
                          searchUrl={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q.query)}`}
                        />
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="xray">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {queries.google_xray.map((q, i) => (
                        <QueryCard
                          key={i}
                          title={q.label || `X-Ray ${i + 1}`}
                          query={q.query}
                          searchUrl={`https://www.google.com/search?q=${encodeURIComponent(q.query)}`}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Candidates + breakdown */}
          {sortedCandidates.length > 0 && (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-5">
              {/* Ranking list */}
              <Card className="rounded-3xl border-slate-200 shadow-sm 2xl:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Candidate Ranking</CardTitle>
                      <CardDescription>Sorted by weighted fit score</CardDescription>
                    </div>
                    <Badge className="rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                      {sortedCandidates.length} analyzed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedCandidates.map((c, idx) => {
                    const profile = c.parsed_profile || {};
                    const match   = c.match_result   || {};
                    const isSelected = selected?.id === c.id;
                    return (
                      <motion.button
                        key={c.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => setSelectedCandidate(c)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900">{profile.name || 'מועמד'}</span>
                              <VerdictBadge level={match.recommendation_level} />
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{profile.headline || ''}</p>
                            {c.profile_url && (
                              <p className="mt-1 truncate text-xs text-slate-400">{c.profile_url}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ScoreBadge score={match.overall_score || 0} />
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Breakdown panel */}
              {selected && (
                <Card className="rounded-3xl border-slate-200 shadow-sm 2xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Candidate Breakdown</CardTitle>
                    <CardDescription>Explainability layer for recruiter confidence</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[520px] pr-3">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold">{selected.parsed_profile?.name || 'מועמד'}</h3>
                            <p className="text-sm text-slate-600">{selected.parsed_profile?.headline || ''}</p>
                          </div>
                          <ScoreBadge score={selected.match_result?.overall_score || 0} />
                        </div>

                        <Separator />

                        {selected.match_result?.category_scores && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold">Score Breakdown</h4>
                            {Object.entries(selected.match_result.category_scores).map(([k, v]) => (
                              <BreakdownBar key={k} label={k} value={v} />
                            ))}
                          </div>
                        )}

                        <Separator />

                        {selected.match_result?.strengths?.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Why this candidate fits</h4>
                            {selected.match_result.strengths.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {selected.match_result?.gaps?.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Gaps / unknowns</h4>
                            {selected.match_result.gaps.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {selected.match_result?.recommendation && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Recommended next step</h4>
                            <p className="text-sm leading-6 text-slate-700">{selected.match_result.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}