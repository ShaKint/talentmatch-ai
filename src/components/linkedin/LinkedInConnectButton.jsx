import React, { useState } from 'react';
import { Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function LinkedInConnectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-colors"
        onClick={() => setOpen(true)}
      >
        <Linkedin className="w-4 h-4" />
        חיבור לינקדאין
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              חיבור לינקדאין
            </DialogTitle>
            <DialogDescription>
              בחר כיצד תרצה לחבר את לינקדאין למערכת
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* Option 1: Shared */}
            <button
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-[#0A66C2] hover:bg-blue-50 transition-all text-right group"
              onClick={() => setOpen(false)}
            >
              <div className="w-10 h-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0A66C2]/20">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">חיבור משותף</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  חבר את החשבון שלך — כל המשתמשים במערכת ישתמשו בפרופיל זה לפרסום, חיפוש מועמדים והצטרפות לקבוצות.
                </p>
              </div>
            </button>

            {/* Option 2: Per user */}
            <button
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-[#0A66C2] hover:bg-blue-50 transition-all text-right group"
              onClick={() => setOpen(false)}
            >
              <div className="w-10 h-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0A66C2]/20">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">חיבור אישי לכל משתמש</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  כל משתמש מחבר את הפרופיל האישי שלו — פרסומים וחיפושים יתבצעו דרך החשבון האישי של כל משתמש.
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}