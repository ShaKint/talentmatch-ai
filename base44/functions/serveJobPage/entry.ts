import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await base44.asServiceRole.entities.Job.get(jobId);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const template = job.design_template || 'tech';

    // Build the job data payload for the template
    const jobPayload = {
      job: {
        id: job.id,
        title: job.title,
        location: job.parsed_data?.location || '',
        about_he: job.parsed_data?.about || '',
        essence_he: job.parsed_data?.essence || '',
        responsibilities_he: (job.parsed_data?.responsibilities || []).join('\n'),
        dna_he: job.parsed_data?.dna || '',
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
      template,
    };

    return Response.json(jobPayload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});