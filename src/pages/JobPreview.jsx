import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function JobPreview() {
  const { id } = useParams();
  const containerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Fetch job via public backend function (no user auth needed)
      const res = await base44.functions.invoke('getPublicJob', { jobId: id });
      const job = res.data;

      if (!job || !isMounted) { setError(true); return; }

      const template = job.design_template || 'tech';
      const templateFile = template === 'bit' ? '/templates/bit.html' : '/templates/tech.html';

      const templateRes = await fetch(templateFile);
      if (!templateRes.ok) { setError(true); return; }
      const html = await templateRes.text();

      if (!isMounted || !containerRef.current) return;

      const jobPayload = {
        job: {
          id: job.id,
          title: job.title,
          location: '',
          about_he: '',
          essence_he: '',
          responsibilities_he: (job.parsed_data?.must_have || []).map(r => r.skill).join('\n'),
          dna_he: '',
        },
        requirements: [
          ...(job.parsed_data?.must_have || []).map(r => ({
            requirement: r.skill + (r.min_experience_years ? ` (${r.min_experience_years}+ שנים)` : ''),
            priority: 'must',
            category: 'skills_tech',
          })),
          ...(job.parsed_data?.nice_to_have || []).map(r => ({
            requirement: r.skill,
            priority: 'should',
            category: 'skills_tech',
          })),
        ],
        company: {
          name: '',
          sector: job.parsed_data?.domain || '',
          logo_url: '',
        },
      };

      // Fix modal file upload button overflow
      const cssfix = `<style>
        .modal, .modal-box, .modal-inner, [class*="modal"] {
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
        .drop-zone, .file-drop, [class*="drop"], [class*="upload"] {
          max-width: 100% !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
        .modal-body, .modal-content, .form-body {
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
      </style>`;

      const injectedHtml = html
        .replace('</head>', cssfix + '</head>')
        .replace(
          /loadJob\(\)\.catch\(showError\);/,
          `window.__JOB_PAYLOAD__ = ${JSON.stringify(jobPayload)};
          async function loadJob() { renderJob(window.__JOB_PAYLOAD__); }
          loadJob().catch(showError);`
        );

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;height:100vh;border:none;display:block;';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(injectedHtml);
      doc.close();
    }

    load().catch(() => setError(true));
    return () => { isMounted = false; };
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-900 text-white">
        <span className="text-4xl">🔍</span>
        <p>המשרה לא נמצאה או הוסרה</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ minHeight: '100vh' }}>
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}