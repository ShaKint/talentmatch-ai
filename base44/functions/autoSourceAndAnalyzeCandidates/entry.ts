import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId) return Response.json({ error: 'jobId is required' }, { status: 400 });

    // Get job and queries
     const job = await base44.asServiceRole.entities.Job.get(jobId);
     if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    const xrayQueries = job.generated_queries?.google_xray || [];
    if (xrayQueries.length === 0) {
      return Response.json({ error: 'No X-Ray queries generated for this job' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const cx = Deno.env.get('GOOGLE_SEARCH_CX');
    if (!apiKey || !cx) {
      return Response.json({ error: 'Google Search credentials not configured' }, { status: 500 });
    }

    const addedCandidates = [];
    const errors = [];

    // Run each query
    for (const queryObj of xrayQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(queryObj.query)}&num=10`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchRes.ok) {
          errors.push(`Query "${queryObj.label}": ${searchData.error?.message || 'Search failed'}`);
          continue;
        }

        const items = searchData.items || [];
        
        // Create candidate for each result
        for (const item of items) {
          try {
            // Check if candidate with this profile_url already exists
            const existing = await base44.entities.Candidate.filter({
              job_id: jobId,
              profile_url: item.link
            });

            if (existing.length > 0) continue;

            // Create candidate
            const candidate = await base44.entities.Candidate.create({
              job_id: jobId,
              profile_url: item.link,
              raw_text: `${item.title}\n\n${item.snippet}`,
              status: 'pending'
            });

            addedCandidates.push({
              id: candidate.id,
              url: item.link,
              title: item.title
            });

            // Trigger analysis
            await base44.functions.invoke('analyzeCandidate', {
              jobId,
              candidateId: candidate.id
            });
          } catch (err) {
            errors.push(`Failed to create candidate from "${item.title}": ${err.message}`);
          }
        }
      } catch (err) {
        errors.push(`Query "${queryObj.label}" failed: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      addedCandidates,
      total: addedCandidates.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});