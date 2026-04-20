import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const levelConfig = {
  strong_fit: { label: 'מתאים מאוד', className: 'bg-green-100 text-green-700 border-green-200' },
  good_fit:   { label: 'מתאים',      className: 'bg-primary/10 text-primary border-primary/20' },
  partial_fit:{ label: 'מתאים חלקית','className': 'bg-amber-100 text-amber-700 border-amber-200' },
  weak_fit:   { label: 'התאמה נמוכה', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function getScoreColor(s) {
  if (s >= 80) return { ring: '#2dd4bf', text: 'text-accent' };
  if (s >= 60) return { ring: 'hsl(var(--primary))', text: 'text-primary' };
  if (s >= 40) return { ring: '#f59e0b', text: 'text-amber-500' };
  return { ring: 'hsl(var(--destructive))', text: 'text-destructive' };
}

function BigScoreRing({ score }) {
  const size = 80;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { ring, text } = getScoreColor(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={ring} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-black leading-none ${text}`}>{score}%</span>
      </div>
    </div>
  );
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/40 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-foreground">{initials}</span>
    </div>
  );
}

export default function MatchScoreCard({ candidate, index = 0 }) {
  const match = candidate.match_result;
  const profile = candidate.parsed_profile;
  const isPending = candidate.status === 'pending' || !match;
  const level = levelConfig[match?.recommendation_level] || levelConfig.partial_fit;
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`למחוק את ${profile?.name || 'המועמד'}?`)) return;
    setDeleting(true);
    await base44.entities.Candidate.delete(candidate.id);
    queryClient.invalidateQueries({ queryKey: ['candidates', candidate.job_id] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 relative group ${deleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <button
        onClick={handleDelete}
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar name={profile?.name} />

        {/* Name + title + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-foreground text-base leading-tight">{profile?.name || 'מועמד'}</h4>
                {candidate.profile_url && (
                  <a href={candidate.profile_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </a>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{profile?.headline || ''}</p>
              {profile?.locations?.length > 0 && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{profile.locations[0]}</p>
              )}
            </div>

            {/* Score ring */}
            {isPending ? (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">מנתח...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <BigScoreRing score={match?.overall_score || 0} />
                <Badge variant="outline" className={`text-xs ${level.className}`}>{level.label}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation summary */}
      {match?.recommendation && (
        <div className="mt-4 bg-secondary/40 rounded-xl px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed">{match.recommendation}</p>
        </div>
      )}

      {/* Strengths & Gaps */}
      {(match?.strengths?.length > 0 || match?.gaps?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.strengths?.slice(0, 3).map((s, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">{s}</span>
          ))}
          {match.gaps?.slice(0, 2).map((g, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full">{g}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}