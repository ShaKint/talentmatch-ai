import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, Zap, Loader2 } from 'lucide-react';

export default function NewJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const job = await base44.entities.Job.create({
        title,
        raw_description: description,
        emphasis_notes: notes,
        status: 'parsing',
      });
      // Trigger AI parsing
      await base44.functions.invoke('parseJobDescription', { jobId: job.id });
      return job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${job.id}`);
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה למשרות
        </button>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">משרה חדשה</h1>
        <p className="text-muted-foreground mt-1">הזן תיאור משרה והמערכת תייצר שאילתות חיפוש אוטומטיות</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">שם המשרה</Label>
          <Input
            id="title"
            placeholder='למשל: "Fullstack Team Leader"'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">תיאור המשרה</Label>
          <Textarea
            id="desc"
            placeholder="הדבק כאן את תיאור המשרה המלא..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[250px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">דגשים נוספים (אופציונלי)</Label>
          <Textarea
            id="notes"
            placeholder="למשל: חובה ניסיון ניהולי, עדיפות ל-mobile background, חשוב שיהיה hands-on..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span>המערכת תנתח את התיאור ותייצר שאילתות חיפוש</span>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || !description || createMutation.isPending}
            className="gap-2 min-w-[160px]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                צור ונתח
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}