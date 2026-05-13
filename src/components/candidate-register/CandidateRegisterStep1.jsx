import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Linkedin } from 'lucide-react';

export default function CandidateRegisterStep1({ data, update }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">פרטים אישיים</h2>
        <p className="text-sm text-muted-foreground mt-1">המידע שיעזור לנו להכיר אותך</p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> שם מלא</Label>
        <Input
          placeholder="ישראל ישראלי"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> טלפון</Label>
        <Input
          placeholder="050-0000000"
          value={data.phone}
          onChange={(e) => update({ phone: e.target.value })}
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" /> פרופיל LinkedIn (אופציונלי)</Label>
        <Input
          placeholder="https://linkedin.com/in/..."
          value={data.profile_url}
          onChange={(e) => update({ profile_url: e.target.value })}
          dir="ltr"
        />
      </div>
    </div>
  );
}