import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, FileText, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import UploadZone from './UploadZone';
import DocumentList from './DocumentList';

const CATEGORIES = ['תרבות ארגונית', 'מתודולוגיה', 'מבנה ארגוני', 'תהליכים', 'טכנולוגיה', 'כללי'];

export default function OrgContentTab() {
  const [mode, setMode] = useState(null); // 'text' | 'file'
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('כללי');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['rag-docs', 'organization'],
    queryFn: () => base44.entities.RagDocument.filter({ scope: 'organization' }, '-created_date'),
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
          prompt: 'Extract all text content from this file. Return all the text as-is, preserving all details.',
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
        scope: 'organization',
        category,
        content_type: contentType,
        raw_text: rawText,
        file_url: fileUrl,
        file_name: fileName,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-docs', 'organization'] });
      toast({ title: 'המסמך נוסף בהצלחה' });
      setTitle(''); setText(''); setFile(null); setMode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RagDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rag-docs', 'organization'] }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">תוכן כלל-ארגוני</h2>
          <p className="text-sm text-muted-foreground">מידע על החברה, תרבות, מתודולוגיה — זמין לכל הסוכנים</p>
        </div>
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
      </div>

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

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> קטגוריה</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    category === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
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
    </div>
  );
}