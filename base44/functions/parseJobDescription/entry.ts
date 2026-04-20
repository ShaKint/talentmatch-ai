import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await req.json();

  const job = await base44.entities.Job.get(jobId);

  // Step 1: Parse JD into structured data
  const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an expert technical recruiter. Parse this job description into a structured format.

JOB DESCRIPTION:
${job.raw_description}

${job.emphasis_notes ? `RECRUITER NOTES: ${job.emphasis_notes}` : ''}

Extract:
1. title - the exact job title
2. seniority - junior/mid/senior/lead/principal/director
3. must_have - array of MUST HAVE skills/requirements (be specific)
4. nice_to_have - array of NICE TO HAVE skills
5. domain - primary domain (e.g. fintech, consumer, enterprise, etc.)
6. management_required - boolean, does this role require people management?
7. alternative_titles - array of equivalent job titles someone might use on their profile
8. weights - scoring weights object with these categories that sum to 100:
   - leadership (0-100)
   - primary_stack (0-100) 
   - secondary_stack (0-100)
   - architecture (0-100)
   - cloud_devops (0-100)
   
The weights should reflect the job's priorities. For example, a Team Lead role should weight leadership higher. A pure IC role should weight technical skills higher.

Be thorough with alternative_titles - include variations like "Team Lead" / "Tech Lead" / "Engineering Lead" etc.
For must_have and nice_to_have, also include technology synonyms. E.g. if "Backend" is mentioned, also include "Java", "Spring Boot", "APIs" etc. as related terms.`,
    response_json_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        seniority: { type: "string" },
        must_have: { type: "array", items: { type: "string" } },
        nice_to_have: { type: "array", items: { type: "string" } },
        domain: { type: "string" },
        management_required: { type: "boolean" },
        alternative_titles: { type: "array", items: { type: "string" } },
        weights: {
          type: "object",
          properties: {
            leadership: { type: "number" },
            primary_stack: { type: "number" },
            secondary_stack: { type: "number" },
            architecture: { type: "number" },
            cloud_devops: { type: "number" }
          }
        }
      }
    }
  });

  // Step 2: Generate search queries
  const queries = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an expert sourcer/recruiter who specializes in Boolean search and X-Ray search on Google.

Based on this parsed job data, generate search queries:

JOB DATA:
${JSON.stringify(parsed, null, 2)}

Generate:
1. linkedin_boolean - Array of 4 LinkedIn Boolean search queries, each with a "label" (e.g. "Exact Match", "Broad Match", "Primary Stack Focus", "Leadership Focus") and "query" (the actual Boolean string for LinkedIn search bar)
2. google_xray - Array of 4 Google X-Ray search queries, each with a "label" and "query" (using site:linkedin.com/in format)

Rules for LinkedIn Boolean:
- Use AND, OR, NOT operators
- Use quotes for exact phrases
- Use parentheses for grouping
- Include title variations

Rules for Google X-Ray:
- Always start with site:linkedin.com/in
- Use quotes for exact phrases
- Use OR between alternatives
- Include location if relevant
- Generate different strategies: exact, broad, stack-focused, seniority-focused

Make the queries practical and ready to copy-paste.`,
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

  // Update job with parsed data and queries
  await base44.asServiceRole.entities.Job.update(jobId, {
    parsed_data: parsed,
    generated_queries: queries,
    status: 'active'
  });

  return Response.json({ parsed_data: parsed, generated_queries: queries });
});