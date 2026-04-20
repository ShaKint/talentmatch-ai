import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Layers, Weight } from 'lucide-react';

export default function ParsedRequirements({ parsedData }) {
  if (!parsedData) return null;

  const weights = parsedData.weights || {};

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          דרישות מפורקות
        </h3>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">תפקיד</p>
            <p className="font-medium text-foreground">{parsedData.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">סניוריטי</p>
            <p className="font-medium text-foreground capitalize">{parsedData.seniority}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">תחום</p>
            <p className="font-medium text-foreground">{parsedData.domain || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">ניהול נדרש</p>
            <p className="font-medium text-foreground">{parsedData.management_required ? 'כן' : 'לא'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-accent" /> חובה
          </p>
          <div className="flex flex-wrap gap-1.5">
            {parsedData.must_have?.map((skill, i) => (
              <Badge key={i} className="bg-accent/10 text-accent border-accent/20 text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Star className="w-3 h-3 text-chart-4" /> יתרון
          </p>
          <div className="flex flex-wrap gap-1.5">
            {parsedData.nice_to_have?.map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {parsedData.alternative_titles?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">כותרות חלופיות</p>
            <div className="flex flex-wrap gap-1.5">
              {parsedData.alternative_titles.map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(weights).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">משקלות ניקוד</p>
            <div className="space-y-2">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground w-8 text-left">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}