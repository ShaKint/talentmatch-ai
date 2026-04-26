import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Palette, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const templateLabels = { tech: 'Tech Dark', bit: 'Bit Light' };

export default function JobPublicLink({ job, jobId }) {
  const [copied, setCopied] = useState(false);
  const [changingTemplate, setChangingTemplate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publicUrl = `${window.location.origin}/job-preview/${jobId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'הקישור הועתק!' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: job.title, url: publicUrl });
    } else {
      handleCopy();
    }
  };

  const handleToggleTemplate = async () => {
    const next = (job.design_template || 'tech') === 'bit' ? 'tech' : 'bit';
    setChangingTemplate(true);
    await base44.entities.Job.update(jobId, { design_template: next });
    queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    setChangingTemplate(false);
    toast({ title: `עיצוב שונה ל-${templateLabels[next]}` });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary" />
          דף משרה ציבורי
        </h3>
      </div>
      <div className="p-5 space-y-3">
        {/* Template */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Palette className="w-4 h-4" />
            <span>עיצוב: <span className="font-medium text-foreground">{templateLabels[job.design_template || 'tech']}</span></span>
          </div>
          <button
            onClick={handleToggleTemplate}
            disabled={changingTemplate}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            החלף עיצוב
          </button>
        </div>

        {/* URL */}
        <div className="bg-secondary/50 rounded-lg p-3 text-xs font-mono text-muted-foreground truncate">
          {publicUrl}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'הועתק!' : 'העתק'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" />
            שתף
          </Button>
          <Button size="sm" className="gap-1.5 flex-1" onClick={() => window.open(publicUrl, '_blank')}>
            <ExternalLink className="w-3.5 h-3.5" />
            פתח
          </Button>
        </div>
      </div>
    </div>
  );
}