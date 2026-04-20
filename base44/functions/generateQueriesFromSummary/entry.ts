import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId, summary } = await req.json();

  const job = await base44.entities.Job.get(jobId);

  const queries = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a world-class technical sourcer specializing in the Israeli tech market.

A recruiter wrote this free-text summary describing exactly what they're looking for in a candidate:
"${summary}"

Original job title: ${job.parsed_data?.title || job.title}
Domain: ${job.parsed_data?.domain || ''}

Based on the recruiter's summary ONLY (prioritize it over the job description), generate sharp Boolean and X-Ray search queries.

CRITICAL RULES:
- LinkedIn Boolean queries MUST be under 200 characters.
- Google X-Ray queries MUST be under 180 characters.
- Use ONLY 2-4 key terms per query.
- Use EXACT technology/title names as they appear on LinkedIn profiles.
- Each query uses a DIFFERENT STRATEGY to reach different candidate pools.
- NEVER use generic terms like "software engineer", "developer".
- Add "Israel" to all Google X-Ray queries (unless the recruiter specified another location).

Generate 5 linkedin_boolean queries and 5 google_xray queries.
For linkedin_boolean strategies:
1. Title Focus — key titles from the summary
2. Primary Stack + Seniority — core tech stack + seniority signal
3. Unique Tech Combo — specific technologies that only appear together on matching profiles
4. Broad Reach — slightly broader, catches non-standard titles but right skills
5. Domain + Role Signal — domain keyword + role/title combination

For google_xray strategies:
1. Exact Role + Israel — site:linkedin.com/in + quoted title + Israel
2. Core Stack + Israel — site:linkedin.com/in + 2 key technologies + seniority + Israel
3. Unique Skill Combo + Israel — site:linkedin.com/in + most unique skill combo + Israel
4. Title Variations + Israel — site:linkedin.com/in + OR of title variations + Israel
5. GitHub Signal — site:github.com + key technologies (finds active contributors)

Return JSON with linkedin_boolean and google_xray arrays. Each item: "label" (short strategy name) and "query" (ready to paste).`,
    response_json_schema: {
      type: "object",
      properties: {
        linkedin_boolean: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              query: { type: "string" }
            }
          }
        },
        google_xray: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              query: { type: "string" }
            }
          }
        }
      }
    }
  });

  // Save the custom queries alongside (or replace) generated_queries
  await base44.asServiceRole.entities.Job.update(jobId, {
    generated_queries: queries
  });

  return Response.json({ generated_queries: queries });
});