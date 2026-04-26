import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function JobPreview() {
  const { id } = useParams();
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Fetch job data
      const job = await base44.entities.Job.get(id);
      if (!job || !isMounted) return;

      const template = job.design_template || 'tech';
      const templateFile = template === 'bit' ? '/templates/bit.html' : '/templates/tech.html';

      // Fetch the HTML template
      const res = await fetch(templateFile);
      const html = await res.text();

      if (!isMounted || !containerRef.current) return;

      // Build job data payload
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

      // Inject job data into the template via a script override
      const injectedHtml = html.replace(
        'loadJob().catch(showError);',
        `
        window.__JOB_PAYLOAD__ = ${JSON.stringify(jobPayload)};
        async function loadJob() {
          renderJob(window.__JOB_PAYLOAD__);
        }
        loadJob().catch(showError);
        `
      );

      // Create an iframe and inject the content
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.display = 'block';

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(injectedHtml);
      doc.close();
    }

    load();
    return () => { isMounted = false; };
  }, [id]);

  return (
    <div ref={containerRef} style={{ minHeight: '100vh' }}>
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}