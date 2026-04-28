import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function CvUploadModal({ jobId, jobTitle, onClose, theme = 'dark' }) {
  const [step, setStep] = useState('idle'); // idle | uploading | success | error
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = theme === 'dark';

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setErrorMsg('יש להעלות קובץ PDF, DOC, DOCX או TXT');
      return;
    }
    setFile(f);
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStep('uploading');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
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
      if (!rawText) throw new Error('לא הצלחנו לחלץ טקסט מהקובץ');

      const created = await base44.entities.Candidate.create({
        job_id: jobId,
        raw_text: rawText,
        status: 'pending',
      });
      await base44.functions.invoke('analyzeCandidate', { candidateId: created.id });
      setStep('success');
    } catch (e) {
      setErrorMsg(e.message || 'שגיאה בשליחה');
      setStep('error');
    }
  };

  const overlayBg = isDark ? 'bg-black/70' : 'bg-black/50';
  const modalBg = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-600' : 'border-gray-300';
  const dropBg = isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100';
  const btnPrimary = isDark
    ? 'bg-teal-500 hover:bg-teal-400 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  if (step === 'success') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg}`} dir="rtl">
        <div className={`${modalBg} border rounded-2xl p-8 max-w-sm w-full mx-4 text-center`}>
          <div className="text-5xl mb-4">✅</div>
          <h3 className={`text-xl font-bold mb-2 ${textMain}`}>הקו"ח נשלחו בהצלחה!</h3>
          <p className={`text-sm ${textSub} mb-6`}>קיבלנו את הגשתך ונחזור אליך בהקדם</p>
          <button onClick={onClose} className={`w-full py-2.5 rounded-xl font-semibold ${btnPrimary}`}>
            סגור
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg}`} dir="rtl">
      <div className={`${modalBg} border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-lg font-bold ${textMain}`}>הגש מועמדות</h3>
          <button onClick={onClose} className={`${textSub} hover:${textMain} text-xl leading-none`}>×</button>
        </div>
        <p className={`text-sm ${textSub} mb-5`}>משרה: <span className={`font-medium ${textMain}`}>{jobTitle}</span></p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-teal-400 bg-teal-500/10' : `${borderColor} ${dropBg}`}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('cv-modal-input').click()}
        >
          <input
            id="cv-modal-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📄</span>
              <span className={`text-sm font-medium ${textMain}`}>{file.name}</span>
              <button
                className="text-xs text-red-400 hover:text-red-300 mt-1"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                הסר קובץ
              </button>
            </div>
          ) : (
            <>
              <span className="text-3xl block mb-2">📂</span>
              <p className={`text-sm font-medium ${textMain}`}>גרור קו"ח לכאן או לחץ לבחירה</p>
              <p className={`text-xs ${textSub} mt-1`}>PDF, DOC, DOCX, TXT</p>
            </>
          )}
        </div>

        {/* Error */}
        {(step === 'error' || errorMsg) && (
          <p className="text-red-400 text-sm mt-3 text-center">{errorMsg || 'שגיאה בשליחה, נסה שוב'}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl border ${borderColor} text-sm font-medium ${textSub} hover:${textMain} transition-colors`}
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || step === 'uploading'}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnPrimary}`}
          >
            {step === 'uploading' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                שולח...
              </span>
            ) : 'שלח קו"ח'}
          </button>
        </div>
      </div>
    </div>
  );
}