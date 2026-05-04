import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, AlignLeft, Clock } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  indexed: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'ממתין',
  processing: 'בעיבוד',
  indexed: 'מאונדקס',
  error: 'שגיאה',
};

const typeIcons = {
  text: AlignLeft,
  pdf: FileText,
  doc: FileText,
  presentation: FileText,
  other: FileText,
};

export default function DocumentList({ docs, isLoading, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">אין מסמכים עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => {
        const Icon = typeIcons[doc.content_type] || FileText;
        return (
          <div
            key={doc.id}
            className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc.category && (
                    <span className="text-xs text-muted-foreground">{doc.category}</span>
                  )}
                  {doc.raw_text && (
                    <span className="text-xs text-muted-foreground">
                      {doc.raw_text.length > 0 ? `${Math.round(doc.raw_text.length / 5)} מילים בקירוב` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[doc.status] || statusColors.pending}`}>
                {statusLabels[doc.status] || 'ממתין'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(doc.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}