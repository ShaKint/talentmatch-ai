import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Upload, Link2, FileText, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function AddCandidates({ jobId }) {
  const [urls, setUrls] = useState('');
  const [profileText, setProfileText] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: async (candidates) => {
      const results = [];
      for (const c of candidates) {
        const created = await base44.entities.Candidate.create({
          job_id: jobId,
          profile_url: c.url || '',
          raw_text: c.text || '',
          status: 'pending',
        });
        // Trigger analysis
        try {
          await base44.functions.invoke('analyzeCandidate', { candidateId: created.id });
          results.push(created);
        } catch (e) {
          results.push({ ...created, error: e.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      const successCount = results.filter(r => !r.error).length;
      toast({
        title: `${successCount} מועמדים נוספו`,
        description: 'הניתוח וההתאמה הושלמו',
      });
      setUrls('');
      setProfileText('');
    },
  });

  const handleAddByUrls = () => {
    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
    if (urlList.length === 0) return;
    addMutation.mutate(urlList.map(url => ({ url })));
  };

  const handleAddByText = () => {
    if (!profileText.trim()) return;
    addMutation.mutate([{ text: profileText }]);
  };

  const handleAddByCv = async () => {
    if (!cvFile) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file: cvFile });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: 'Extract all text content from this CV/resume file. Return the full text as-is, preserving names, skills, experience, education and all details.',
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          full_text: { type: 'string', description: 'All text content from the CV/resume' }
        }
      }
    });
    const rawText = result?.full_text || '';
    if (!rawText) {
      toast({ title: 'לא הצלחנו לחלץ טקסט מהקובץ', variant: 'destructive' });
      return;
    }
    addMutation.mutate([{ text: rawText }]);
    setCvFile(null);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          הוסף מועמדים
        </h3>
      </div>
      <div className="p-5">
        <Tabs defaultValue="cv" dir="rtl">
          <TabsList className="bg-secondary mb-4 w-full">
            <TabsTrigger value="cv" className="gap-1.5 flex-1">
              <FileText className="w-3.5 h-3.5" />
              קו"ח
            </TabsTrigger>
            <TabsTrigger value="urls" className="gap-1.5 flex-1">
              <Link2 className="w-3.5 h-3.5" />
              לינקים
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5 flex-1">
              <Upload className="w-3.5 h-3.5" />
              טקסט
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cv" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) setCvFile(f);
              }}
              onClick={() => document.getElementById('cv-file-input').click()}
            >
              <input
                id="cv-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files[0] && setCvFile(e.target.files[0])}
              />
              {cvFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{cvFile.name}</span>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">גרור קובץ קו"ח לכאן</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT</p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              הקובץ יחלץ אוטומטית, ינותח ויקבל ציון התאמה מול דרישות המשרה
            </p>
            <Button
              onClick={handleAddByCv}
              disabled={!cvFile || addMutation.isPending}
              className="gap-2 w-full"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {addMutation.isPending ? 'מחלץ ומנתח...' : 'נתח קו"ח'}
            </Button>
          </TabsContent>

          <TabsContent value="urls" className="space-y-4">
            <div className="space-y-2">
              <Label>לינקים לפרופילי LinkedIn (אחד בכל שורה)</Label>
              <Textarea
                placeholder={"https://linkedin.com/in/john-doe\nhttps://linkedin.com/in/jane-smith"}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleAddByUrls}
              disabled={!urls.trim() || addMutation.isPending}
              className="gap-2"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {addMutation.isPending ? 'מנתח...' : 'הוסף ונתח'}
            </Button>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label>הדבק טקסט של פרופיל (העתק מ-LinkedIn)</Label>
              <Textarea
                placeholder="הדבק כאן את הטקסט מפרופיל LinkedIn - שם, כותרת, ניסיון, כישורים..."
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                className="min-h-[200px] text-sm"
              />
            </div>
            <Button
              onClick={handleAddByText}
              disabled={!profileText.trim() || addMutation.isPending}
              className="gap-2"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {addMutation.isPending ? 'מנתח...' : 'הוסף ונתח'}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}