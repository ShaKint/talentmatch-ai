import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export default function JobCreationStep2({ notes, onNotesChange, onBack, onNext, title }) {
  const suggestedAreas = [
    '📌 דרישות ניהול וקיימות',
    '🔧 טכנולוגיות ספציפיות',
    '🌍 מיקום וסוג עבודה',
    '📊 כמות ניסיון נדרשה',
    '👥 גודל הצוות שידרוך'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">שלב 2: דגשים נוספים</h2>
        <p className="text-sm text-muted-foreground">הוסף הערות חשובות שיעזרו לבחירת מועמדים</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 flex gap-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-primary">טיפ: מה כדאי להזכיר?</p>
            <p className="text-primary/80">דרישות ניהול, עדיפויות טכנולוגיות, דרישות יחסוביות (hands-on %), דרישות מיקום, ניסיון ספציפי</p>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="notes">הערות דגשים (אופציונלי)</Label>
          <Textarea
            id="notes"
            placeholder="למשל:&#10;• חובה ניסיון ניהולי של 3+ שנים&#10;• 50% hands-on, 50% ניהול&#10;• העדפה עבור Kotlin Multiplatform&#10;• צריך להיות comfortable עם remote..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[140px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{notes.length} תווים</p>
        </div>

        {notes.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">הצעות</p>
            <div className="flex flex-wrap gap-2">
              {suggestedAreas.map((area, i) => (
                <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => onNotesChange(notes + (notes ? '\n' : '') + area)}>
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p><strong>משרה:</strong> {title}</p>
          {notes && <p className="mt-2"><strong>דגשים:</strong> {notes.substring(0, 100)}...</p>}
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={onBack}>
            חזור לשלב 1
          </Button>
          <Button onClick={onNext} className="min-w-[140px]">
            המשך לשלב 3
          </Button>
        </div>
      </div>
    </div>
  );
}