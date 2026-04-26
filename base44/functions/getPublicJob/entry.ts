import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Use service role to read job without requiring user auth
    const base44 = createClientFromRequest(req);
    const job = await base44.asServiceRole.entities.Job.get(jobId);

    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return only the public-safe fields
    return Response.json({
      id: job.id,
      title: job.title,
      design_template: job.design_template || 'tech',
      parsed_data: job.parsed_data || {},
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});