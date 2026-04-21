import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Globe, ChevronRight, ChevronLeft, Linkedin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function ResultCard({ item }) {
  const isLinkedIn = item.link?.includes('linkedin.com');

  return (
    <div className="bg-secondary/40 rounded-xl p-4 hover:bg-secondary/70 transition-colors">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isLinkedIn ? (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Linkedin className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {item.title}
          </a>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.snippet}</p>
          <p className="text-xs text-primary/60 mt-1 truncate">{item.displayLink}</p>
        </div>
      </div>
    </div>
  );
}

export default function AutoSourceCandidates({ job }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeQuery, setActiveQuery] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const { toast } = useToast();

  const queries = job?.generated_queries?.google_xray || [];

  const runSearch = async (query, startPage = 1) => {
    setLoading(true);
    setActiveQuery(query);
    setPage(startPage);
    const start = (startPage - 1) * 10 + 1;
    const res = await base44.functions.invoke('searchLinkedInCandidates', { query: query.query, start });
    setResults(res.data.items || []);
    setTotal(res.data.total);
    setLoading(false);
    if ((res.data.items || []).length === 0) {
      toast({ title: 'לא נמצאו תוצאות', description: 'נסה שאילתה אחרת' });
    }
  };

  const handleNext = () => {
    if (activeQuery) runSearch(activeQuery, page + 1);
  };

  const handlePrev = () => {
    if (activeQuery && page > 1) runSearch(activeQuery, page - 1);
  };

  if (!queries.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">
        אין שאילתות X-Ray עדיין. נתח את המשרה כדי לייצר שאילתות.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">חיפוש אוטומטי - Google X-Ray</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Query buttons */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">בחר שאילתה להפעלה</p>
          <div className="flex flex-col gap-2">
            {queries.map((q, i) => (
              <button
                key={i}
                onClick={() => runSearch(q)}
                disabled={loading}
                className={`text-right px-4 py-3 rounded-xl border text-sm transition-all ${
                  activeQuery?.label === q.label
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60 text-foreground'
                }`}
              >
                <span className="font-medium">{q.label}</span>
                <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{q.query}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">מחפש...</span>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                נמצאו ~{parseInt(total || 0).toLocaleString()} תוצאות • עמוד {page}
              </p>
              <Badge variant="outline" className="text-xs">{activeQuery?.label}</Badge>
            </div>

            <div className="space-y-2">
              {results.map((item, i) => (
                <ResultCard key={i} item={item} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={page <= 1} className="gap-1">
                <ChevronRight className="w-3.5 h-3.5" /> הקודם
              </Button>
              <span className="text-xs text-muted-foreground">עמוד {page}</span>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={results.length < 10} className="gap-1">
                הבא <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}