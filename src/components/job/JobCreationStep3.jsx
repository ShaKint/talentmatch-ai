import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function JobCreationStep3({ title, description, notes, isLoading, onBack, onSubmit }) {
  const wordCount = description.trim().split(/\s+/).filter(w => w).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">שלב 3: אישור וניתוח</h2>
        <p className="text-sm text-muted-foreground">בדוק את הפרטים ואשר כדי להתחיל בניתוח</p>
      </div>

      <div className="space-y-4">
        {/* Title Card */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">שם המשרה</p>
              <h3 className="text-xl font-bold text-foreground">{title}</h3>
            </div>
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">תיאור המשרה</p>
            <Badge variant="outline">{wordCount} מילים</Badge>
          </div>
          <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
            {description.substring(0, 200)}...
          </p>
          <p className="text-xs text-primary/60">מעבד בתהליך הניתוח AI</p>
        </div>

        {/* Notes Card */}
        {notes && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">דגשים נוספים</p>
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
              {notes}
            </p>
          </div>
        )}

        {/* AI Processing Info */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 space-y-3">
          <p className="text-sm font-medium text-primary">🤖 מה יקרה בשלב הבא?</p>
          <ul className="text-sm text-primary/80 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-1">1.</span>
              <span>ניתוח AI של דרישות ההשרה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">2.</span>
              <span>יצירת שאילתות חיפוש boolean ו-X-Ray</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">3.</span>
              <span>הגדרת משקלות matching ודירוג</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">4.</span>
              <span>הפניה אל עמוד המשרה להתחלת חיפוש</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          חזור לשלב 2
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="min-w-[180px] gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              מנתח...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              צור והתחל ניתוח
            </>
          )}
        </Button>
      </div>
    </div>
  );
}