import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, AlertCircle, CircleDot, MessageSquare, Save,
  Brain, Cpu, ChevronDown, ChevronUp
} from 'lucide-react';

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

const matchLevelConfig = {
  exact:   { icon: '✅', cls: 'text-green-700 bg-green-50 border-green-200' },
  partial: { icon: '🟡', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  missing: { icon: '❌', cls: 'text-red-700 bg-red-50 border-red-200' },
};

function TechComparisonTable({ items }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, 6);
  return (
    <div className="space-y-2">
      {shown.map((row, i) => {
        const cfg = matchLevelConfig[row.match_level] || matchLevelConfig.partial;
        return (
          <div key={i} className={`rounded-xl border px-3 py-2 text-xs flex items-start gap-2 ${cfg.cls}`}>
            <span className="shrink-0 mt-0.5">{cfg.icon}</span>
            <div className="min-w-0">
              <span className="font-semibold">{row.required}</span>
              {row.candidate_has && row.candidate_has !== row.required && (
                <span className="text-slate-500 ml-1">→ {row.candidate_has}</span>
              )}
              {row.note && <p className="mt-0.5 text-slate-500">{row.note}</p>}
            </div>
          </div>
        );
      })}
      {items.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mt-1"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> הסתר</> : <><ChevronDown className="h-3 w-3" /> הצג {items.length - 6} נוספים</>}
        </button>
      )}
    </div>
  );
}

export default function CandidateBreakdown({ candidate, jobId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(candidate.recruiter_notes || '');
  const [saving, setSaving] = useState(false);

  const profile = candidate.parsed_profile || {};
  const match   = candidate.match_result   || {};

  const handleSaveNotes = async () => {
    setSaving(true);
    await base44.entities.Candidate.update(candidate.id, { recruiter_notes: notes });
    queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
    toast({ title: 'הערות נשמרו' });
    setSaving(false);
  };

  return (
    <ScrollArea className="h-[580px] pr-3">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{profile.name || 'מועמד'}</h3>
            <p className="text-sm text-slate-600">{profile.headline || ''}</p>
          </div>
          <ScoreBadge score={match.overall_score || 0} />
        </div>

        <Separator />

        {/* Score breakdown */}
        {match.category_scores && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Score Breakdown
            </h4>
            {Object.entries(match.category_scores).map(([k, v]) => (
              <BreakdownBar key={k} label={k} value={v} />
            ))}
          </div>
        )}

        <Separator />

        {/* Tech comparison */}
        {match.tech_comparison?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Tech Stack Comparison
            </h4>
            <TechComparisonTable items={match.tech_comparison} />
          </div>
        )}

        {/* Soft skills */}
        {(profile.soft_skills?.length > 0 || match.soft_skills_assessment) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" /> Soft Skills
              </h4>
              {profile.soft_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.soft_skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {match.soft_skills_assessment && (
                <p className="text-xs text-slate-600 leading-5 bg-slate-50 rounded-xl border border-slate-200 p-3">
                  {match.soft_skills_assessment}
                </p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Strengths */}
        {match.strengths?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Why this candidate fits</h4>
            {match.strengths.map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Gaps */}
        {match.gaps?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Gaps / unknowns</h4>
            {match.gaps.map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {match.recommendation && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Recommended next step</h4>
            <p className="text-sm leading-6 text-slate-700">{match.recommendation}</p>
          </div>
        )}

        <Separator />

        {/* Recruiter notes */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> הערות מגייס
          </h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הוסף הערות, תצפיות, סטטוס שיחה..."
            className="min-h-[100px] rounded-xl text-sm resize-none"
          />
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={handleSaveNotes}
            disabled={saving}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'שומר...' : 'שמור הערות'}
          </Button>
        </div>

      </div>
    </ScrollArea>
  );
}