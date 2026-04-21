import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Loader2, User } from 'lucide-react';

const levelConfig = {
  strong_fit: { label: 'מתאים מאוד', className: 'bg-green-100 text-green-700 border-green-200' },
  good_fit:   { label: 'מתאים',      className: 'bg-primary/10 text-primary border-primary/20' },
  partial_fit:{ label: 'מתאים חלקית', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  weak_fit:   { label: 'התאמה נמוכה', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function getScoreColor(s) {
  if (s >= 80) return { ring: '#2dd4bf', text: 'text-accent' };
  if (s >= 60) return { ring: 'hsl(var(--primary))', text: 'text-primary' };
  if (s >= 40) return { ring: '#f59e0b', text: 'text-amber-500' };
  return { ring: 'hsl(var(--destructive))', text: 'text-destructive' };
}

function ScoreRing({ score }) {
  const size = 64;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { ring, text } = getScoreColor(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={ring} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-black ${text}`}>{score}%</span>
      </div>
    </div>
  );
}

export default function LatestAnalyzedCandidate({ candidates }) {
  // Find the most recently analyzed candidate (has match_result, sort by updated_date)
  const analyzed = candidates
    .filter(c => c.match_result && c.status !== 'pending')
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  const candidate = analyzed[0];

  if (!candidate) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">ניתוח אחרון</h3>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
          <User className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">אין ניתוח מועמד עדיין</p>
        </div>
      </div>
    );
  }

  const profile = candidate.parsed_profile;
  const match = candidate.match_result;
  const level = levelConfig[match?.recommendation_level] || levelConfig.partial_fit;
  const initials = (profile?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">ניתוח אחרון</h3>
        <Badge variant="outline" className={`text-xs ${level.className}`}>{level.label}</Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile header */}
        <div className="flex items-center gap-3">
          {candidate.profile_image_url ? (
            <img
              src={candidate.profile_image_url}
              alt={profile?.name}
              className="w-12 h-12 rounded-full object-cover border border-border"
              onError={e => e.target.style.display = 'none'}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/40 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-foreground">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-foreground text-sm leading-tight">{profile?.name || 'מועמד'}</p>
              {candidate.profile_url && (
                <a href={candidate.profile_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                  <Linkedin className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.headline || ''}</p>
            {profile?.locations?.[0] && (
              <p className="text-xs text-muted-foreground/60">{profile.locations[0]}</p>
            )}
          </div>
          <ScoreRing score={match?.overall_score || 0} />
        </div>

        {/* Recommendation */}
        {match?.recommendation && (
          <div className="bg-secondary/40 rounded-lg px-3 py-2">
            <p className="text-xs text-foreground leading-relaxed">{match.recommendation}</p>
          </div>
        )}

        {/* Breakdown bars */}
        {match?.breakdown && (
          <div className="space-y-1.5">
            {Object.entries(match.breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24 shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right">{val}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Strengths & Gaps */}
        {(match?.strengths?.length > 0 || match?.gaps?.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {match.strengths?.slice(0, 2).map((s, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">{s}</span>
            ))}
            {match.gaps?.slice(0, 2).map((g, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full">{g}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}