import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const CAREER_STAGES = [
  { value: 'entry', label: 'כניסה ראשונה לשוק' },
  { value: 'junior', label: 'ג\'וניור (1-2 שנים)' },
  { value: 'mid', label: 'מיד (3-5 שנים)' },
  { value: 'senior', label: 'סניור (5+ שנים)' },
  { value: 'lead', label: 'ליד / ארכיטקט' },
  { value: 'manager', label: 'מנהל' },
];

const WORK_MODELS = [
  { value: 'office', label: 'משרד מלא' },
  { value: 'hybrid', label: 'היברידי' },
  { value: 'remote', label: 'מרחוק מלא' },
  { value: 'flexible', label: 'גמיש' },
];

const FACTORS = ['שכר גבוה', 'פיתוח מקצועי', 'גמישות בשעות', 'עבודה מהבית', 'סביבת עבודה', 'טכנולוגיות מתקדמות', 'חברה גדולה', 'סטארטאפ', 'יציבות תעסוקתית'];

const LOCATIONS = ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'הרצליה', 'רמת גן', 'רחובות', 'באר שבע', 'כל הארץ'];

export default function CandidateRegisterStep3({ data, update }) {
  const toggle = (arr, val) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">העדפות ותנאים</h2>
        <p className="text-sm text-muted-foreground mt-1">עזור לנו למצוא לך את המשרה המושלמת</p>
      </div>

      {/* Salary */}
      <div className="space-y-2">
        <Label>ציפיות שכר ברוטו (₪ לחודש)</Label>
        <div className="flex gap-3 items-center">
          <Input
            type="number"
            placeholder="מינימום"
            value={data.salary_min}
            onChange={(e) => update({ salary_min: e.target.value })}
            dir="ltr"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            placeholder="מקסימום"
            value={data.salary_max}
            onChange={(e) => update({ salary_max: e.target.value })}
            dir="ltr"
          />
        </div>
      </div>

      {/* Career Stage */}
      <div className="space-y-2">
        <Label>שלב קריירה</Label>
        <div className="flex flex-wrap gap-2">
          {CAREER_STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => update({ career_stage: s.value })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                data.career_stage === s.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Work Model */}
      <div className="space-y-2">
        <Label>מודל עבודה מועדף</Label>
        <div className="flex flex-wrap gap-2">
          {WORK_MODELS.map((m) => (
            <button
              key={m.value}
              onClick={() => update({ preferred_work_model: m.value })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                data.preferred_work_model === m.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Important Factors */}
      <div className="space-y-2">
        <Label>מה הכי חשוב לך בעבודה הבאה?</Label>
        <div className="flex flex-wrap gap-2">
          {FACTORS.map((f) => (
            <button
              key={f}
              onClick={() => update({ important_factors: toggle(data.important_factors, f) })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                data.important_factors.includes(f)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2">
        <Label>איזורים מועדפים</Label>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => update({ preferred_locations: toggle(data.preferred_locations, loc) })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                data.preferred_locations.includes(loc)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Open to contact */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="text-sm font-medium text-foreground">פתוח לפניות</p>
          <p className="text-xs text-muted-foreground">אפשר לחברות לפנות אליך ישירות</p>
        </div>
        <Switch
          checked={data.open_to_contact}
          onCheckedChange={(v) => update({ open_to_contact: v })}
        />
      </div>
    </div>
  );
}