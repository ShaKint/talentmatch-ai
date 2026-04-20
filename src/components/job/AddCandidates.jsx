import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Upload, Link2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function AddCandidates({ jobId }) {
  const [urls, setUrls] = useState('');
  const [profileText, setProfileText] = useState('');
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

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          הוסף מועמדים
        </h3>
      </div>
      <div className="p-5">
        <Tabs defaultValue="urls" dir="rtl">
          <TabsList className="bg-secondary mb-4">
            <TabsTrigger value="urls" className="gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              לינקים
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              טקסט חופשי
            </TabsTrigger>
          </TabsList>

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