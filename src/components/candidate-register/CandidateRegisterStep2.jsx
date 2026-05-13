import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';

export default function CandidateRegisterStep2({ data, update }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) update({ cv_file: file, cv_file_name: file.name });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">קורות חיים</h2>
        <p className="text-sm text-muted-foreground mt-1">העלה קובץ או הדבק טקסט ישירות</p>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>העלאת קובץ (PDF / Word)</Label>
        {data.cv_file ? (
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium flex-1">{data.cv_file.name}</span>
            <button onClick={() => update({ cv_file: null, cv_file_name: '' })}>
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">לחץ להעלאת קובץ</span>
            <span className="text-xs">PDF, DOC, DOCX עד 10MB</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
      </div>

      {/* Or text */}
      <div className="space-y-2">
        <Label>או הדבק טקסט קורות חיים</Label>
        <Textarea
          placeholder="הדבק כאן את תוכן קורות החיים שלך..."
          value={data.raw_text}
          onChange={(e) => update({ raw_text: e.target.value })}
          className="min-h-[150px]"
        />
      </div>
    </div>
  );
}