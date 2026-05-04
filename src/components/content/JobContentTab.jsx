import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, FileText, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import UploadZone from './UploadZone';
import DocumentList from './DocumentList';

export default function JobContentTab() {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [mode, setMode] = useState(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date'),
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['rag-docs', 'job', selectedJobId],
    queryFn: () => base44.entities.RagDocument.filter({ scope: 'job', job_id: selectedJobId }, '-created_date'),
    enabled: !!selectedJobId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      let rawText = text;
      let fileUrl = '';
      let fileName = '';
      let contentType = 'text';

      if (mode === 'file' && file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrl = file_url;
        fileName = file.name;
        contentType = file.name.endsWith('.pdf') ? 'pdf'
          : file.name.match(/\.docx?$/) ? 'doc'
          : file.name.match(/\.pptx?$/) ? 'presentation'
          : 'other';

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Extract all text content from this file. Return all the text as-is.',
          file_urls: [file_url],
          response_json_schema: {
            type: 'object',
            properties: { full_text: { type: 'string' } }
          }
        });
        rawText = result?.full_text || '';
      }

      return base44.entities.RagDocument.create({
        title: title || fileName || 'מסמך חדש',
        scope: 'job',
        job_id: selectedJobId,
        content_type: contentType,
        raw_text: rawText,
        file_url: fileUrl,
        file_name: fileName,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-docs', 'job', selectedJobId] });
      toast({ title: 'המסמך נוסף בהצלחה' });
      setTitle(''); setText(''); setFile(null); setMode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RagDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rag-docs', 'job', selectedJobId] }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">תוכן לפי משרה</h2>
        <p className="text-sm text-muted-foreground">מסמכים ספציפיים למשרה — תיאור תפקיד, דרישות מחלקה, ועוד</p>
      </div>

      {/* Job Selector */}
      <div className="space-y-2">
        <Label>בחר משרה</Label>
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="בחר משרה..." />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedJobId && (
        <>
          {/* Add Buttons */}
          {!mode && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode('file')} className="gap-2">
                <FileText className="w-4 h-4" /> העלה קובץ
              </Button>
              <Button size="sm" onClick={() => setMode('text')} className="gap-2">
                <Plus className="w-4 h-4" /> הוסף טקסט
              </Button>
            </div>
          )}

          {/* Add Form */}
          {mode && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="space-y-2">
                <Label>כותרת</Label>
                <Input
                  placeholder="שם המסמך / תוכן"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {mode === 'text' ? (
                <div className="space-y-2">
                  <Label>תוכן</Label>
                  <Textarea
                    placeholder="הדבק או הקלד את התוכן כאן..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[160px]"
                  />
                </div>
              ) : (
                <UploadZone file={file} onFileSelect={setFile} onClear={() => setFile(null)} />
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setMode(null); setTitle(''); setText(''); setFile(null); }}>
                  ביטול
                </Button>
                <Button
                  size="sm"
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending || (!text.trim() && !file)}
                  className="gap-2"
                >
                  {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {addMutation.isPending ? 'מעלה...' : 'שמור'}
                </Button>
              </div>
            </div>
          )}

          {/* Documents List */}
          <DocumentList docs={docs} isLoading={isLoading} onDelete={(id) => deleteMutation.mutate(id)} />
        </>
      )}

      {!selectedJobId && (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">בחר משרה להצגת התוכן שלה</p>
        </div>
      )}
    </div>
  );
}