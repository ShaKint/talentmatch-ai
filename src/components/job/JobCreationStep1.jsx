import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function JobCreationStep1({ title, description, onTitleChange, onDescriptionChange, onNext }) {
  const wordCount = description.trim().split(/\s+/).filter(w => w).length;
  const isValid = title.trim().length > 0 && wordCount >= 50;
  const warnings = [];
  
  if (title.length === 0) warnings.push('הזן שם משרה');
  if (wordCount < 50) warnings.push(`תיאור קצר מדי (${wordCount}/50 מילים)`);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">שלב 1: פרטים בסיסיים</h2>
        <p className="text-sm text-muted-foreground">התחל בשם המשרה ותיאור מלא</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">שם המשרה *</Label>
          <Input
            id="title"
            placeholder='למשל: "Mobile Team Lead" או "Senior Backend Engineer"'
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground">{title.length > 0 ? '✓ בסדר' : 'שדה חובה'}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">תיאור המשרה המלא *</Label>
          <Textarea
            id="desc"
            placeholder="הדבק את המלא של פוסט המשרה... (מינימום 50 מילים)"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[280px] font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {wordCount} / 50 מילים {wordCount >= 50 ? '✓' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(description.length)} תווים
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20 space-y-2">
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {isValid && (
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-primary">הנתונים תקינים!</span>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="min-w-[140px]"
          >
            המשך לשלב 2
          </Button>
        </div>
      </div>
    </div>
  );
}