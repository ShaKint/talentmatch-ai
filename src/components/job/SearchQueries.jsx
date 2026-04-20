import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Globe, Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import RecruiterSummaryInput from './RecruiterSummaryInput';

function QueryCard({ query, type }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(query.query);
    setCopied(true);
    toast({ title: 'הועתק!', description: 'השאילתה הועתקה ללוח' });
    setTimeout(() => setCopied(false), 2000);
  };

  const openInGoogle = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query.query)}`, '_blank');
  };

  return (
    <div className="bg-secondary/50 rounded-lg p-4 group hover:bg-secondary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">{query.label}</Badge>
        <div className="flex items-center gap-1">
          {type === 'xray' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openInGoogle}>
              <Globe className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
      <p className="text-sm font-mono text-foreground leading-relaxed break-all">{query.query}</p>
    </div>
  );
}

export default function SearchQueries({ queries, jobId }) {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    await base44.functions.invoke('parseJobDescription', { jobId });
    queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    setRefreshing(false);
    toast({ title: 'שאילתות חודשו!' });
  };

  if (!queries) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          שאילתות חיפוש
        </h3>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'מייצר...' : 'רענן שאילתות'}
        </Button>
      </div>
      <div className="p-5">
        <Tabs defaultValue="linkedin" dir="rtl">
          <TabsList className="bg-secondary mb-4">
            <TabsTrigger value="linkedin">LinkedIn Boolean</TabsTrigger>
            <TabsTrigger value="xray">Google X-Ray</TabsTrigger>
          </TabsList>
          <TabsContent value="linkedin" className="space-y-3">
            {queries.linkedin_boolean?.map((q, i) => (
              <QueryCard key={i} query={q} type="linkedin" />
            ))}
          </TabsContent>
          <TabsContent value="xray" className="space-y-3">
            {queries.google_xray?.map((q, i) => (
              <QueryCard key={i} query={q} type="xray" />
            ))}
          </TabsContent>
        </Tabs>
      </div>
      <RecruiterSummaryInput jobId={jobId} />
    </div>
  );
}