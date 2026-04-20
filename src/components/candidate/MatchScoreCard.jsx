import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { User, ExternalLink, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const levelConfig = {
  strong_fit: { label: 'מתאים מאוד', className: 'bg-accent/10 text-accent border-accent/20' },
  good_fit: { label: 'מתאים', className: 'bg-primary/10 text-primary border-primary/20' },
  partial_fit: { label: 'מתאים חלקית', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  weak_fit: { label: 'התאמה נמוכה', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function ScoreRing({ score, size = 56 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return 'hsl(var(--accent))';
    if (s >= 60) return 'hsl(var(--primary))';
    if (s >= 40) return 'hsl(var(--chart-4))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--secondary))" strokeWidth="4"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor(score)} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{score}%</span>
      </div>
    </div>
  );
}

export default function MatchScoreCard({ candidate, index = 0 }) {
  const match = candidate.match_result;
  const profile = candidate.parsed_profile;
  const level = levelConfig[match?.recommendation_level] || levelConfig.partial_fit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <ScoreRing score={match?.overall_score || 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                {profile?.name || 'מועמד'}
                {candidate.profile_url && (
                  <a href={candidate.profile_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </h4>
              <p className="text-sm text-muted-foreground">{profile?.headline || ''}</p>
            </div>
            <Badge variant="outline" className={level.className}>
              {level.label}
            </Badge>
          </div>

          {match?.category_scores && (
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(match.category_scores).slice(0, 5).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">{key}</div>
                  <div className={`text-sm font-bold ${
                    value >= 80 ? 'text-accent' : value >= 60 ? 'text-primary' : value >= 40 ? 'text-chart-4' : 'text-destructive'
                  }`}>{value}%</div>
                </div>
              ))}
            </div>
          )}

          {match?.strengths && match.strengths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {match.strengths.slice(0, 3).map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-md">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {match?.recommendation && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
          {match.recommendation}
        </p>
      )}

      {match?.gaps && match.gaps.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {match.gaps.slice(0, 3).map((g, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-md">
              {g}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}