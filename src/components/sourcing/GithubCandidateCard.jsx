import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, MapPin, Building2, Star, BookOpen, Users, ExternalLink, Plus, Check } from 'lucide-react';

export default function GithubCandidateCard({ candidate, jobId, onImport, importing }) {
  const [imported, setImported] = useState(false);

  const handleImport = async () => {
    await onImport(candidate);
    setImported(true);
  };

  const topLangs = [...new Set(
    candidate.top_repos.map(r => r.language).filter(Boolean)
  )].slice(0, 4);

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <img
            src={candidate.avatar_url}
            alt={candidate.name}
            className="w-12 h-12 rounded-full border-2 border-slate-100 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-base leading-tight">{candidate.name}</h3>
              <a
                href={candidate.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-sm text-slate-500">@{candidate.login}</p>
          </div>
        </div>

        {/* Bio */}
        {candidate.bio && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-5">{candidate.bio}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
          {candidate.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.location}</span>
          )}
          {candidate.company && (
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{candidate.company}</span>
          )}
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{candidate.followers.toLocaleString()} followers</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{candidate.public_repos} repos</span>
        </div>

        {/* Languages */}
        {topLangs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {topLangs.map(lang => (
              <Badge key={lang} variant="secondary" className="text-xs rounded-full px-2 py-0.5">{lang}</Badge>
            ))}
          </div>
        )}

        {/* Top Repos */}
        {candidate.top_repos.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {candidate.top_repos.slice(0, 3).map(repo => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 hover:bg-slate-100 transition-colors group"
              >
                <span className="text-slate-700 font-medium truncate">{repo.name}</span>
                <span className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
                  <Star className="h-3 w-3 text-amber-400" />
                  {repo.stars.toLocaleString()}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Import Button */}
        {jobId && (
          <Button
            size="sm"
            className={`w-full rounded-xl text-xs h-8 ${imported ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={handleImport}
            disabled={imported || importing}
          >
            {imported ? (
              <><Check className="h-3.5 w-3.5 mr-1" />נוסף למועמדים</>
            ) : (
              <><Plus className="h-3.5 w-3.5 mr-1" />הוסף כמועמד</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}