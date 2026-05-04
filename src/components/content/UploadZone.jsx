import React, { useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

export default function UploadZone({ onFileSelect, file, onClear }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFileSelect(f);
      }}
      onClick={() => document.getElementById('rag-file-input').click()}
    >
      <input
        id="rag-file-input"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.pptx,.ppt"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{file.name}</span>
          <button
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">גרור קובץ לכאן או לחץ להעלאה</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT, PPT, PPTX</p>
        </>
      )}
    </div>
  );
}