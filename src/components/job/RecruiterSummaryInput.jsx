import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export default function RecruiterSummaryInput({ jobId }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!summary.trim()) return;
    setLoading(true);
    await base44.functions.invoke('generateQueriesFromSummary', { jobId, summary });
    queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    setLoading(false);
    toast({ title: 'שאילתות נוצרו!', description: 'השאילתות עודכנו בהתבסס על הסיכום שלך' });
    setOpen(false);
  };

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium">
          <Wand2 className="w-4 h-4 text-primary" />
          צור שאילתות מסיכום חופשי
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            תאר בשפה חופשית את המועמד האידיאלי — ניסיון, טכנולוגיות, סוג חברה, ניהול וכו׳. המערכת תייצר Boolean ו-X-Ray בהתאם.
          </p>
          <Textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="לדוגמה: מנהל צוות פיתוח fullstack שעבד בחברה גדולה על מוצר משמעותי, ניסיון ב-React ו-Node, hands-on, ניהל 4-8 מפתחים..."
            className="text-sm h-28 resize-none"
            dir="rtl"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !summary.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> מייצר שאילתות...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> צור שאילתות</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}