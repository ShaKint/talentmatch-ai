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
    prompt: `You are a world-class technical sourcer. Generate PRACTICAL, SHORT Boolean and X-Ray search queries that actually return results on LinkedIn and Google.

CRITICAL RULES — follow strictly:
- LinkedIn Boolean queries MUST be under 200 characters. LinkedIn's search bar truncates long queries and returns 0 results.
- Google X-Ray queries MUST be under 150 characters. Google ignores long X-Ray queries.
- Use ONLY 2-3 key terms per query. More terms = fewer results = useless query.
- Prefer short title keywords over long exact phrases. "Android Lead" beats "Senior Android Team Leader".
- Never use full sentences. Never use long must_have arrays.
- Each query must use a DIFFERENT STRATEGY so they return different candidate pools.

JOB DATA (extract only the 3-4 most important signals):
Title: ${parsed.title}
Key skills: ${(parsed.must_have || []).slice(0, 5).join(', ')}
Alternative titles: ${(parsed.alternative_titles || []).slice(0, 4).join(', ')}
Seniority: ${parsed.seniority}
Domain: ${parsed.domain || ''}

Generate 4 linkedin_boolean queries using these strategies:
1. "Title Focus" — 2-3 title variations only, no skills. E.g: ("Android Team Lead" OR "Mobile Tech Lead" OR "Android Lead")
2. "Stack + Title" — 1 title keyword AND 2 core skills. E.g: ("Team Lead" OR "Tech Lead") AND (Android OR Kotlin) AND Spring
3. "Broad Reach" — skills only, no title constraint, catch people with different titles. E.g: (Android OR Kotlin OR iOS) AND (Spring OR Backend) AND Lead
4. "Seniority Signal" — use seniority words + top 2 skills. E.g: (Senior OR Lead OR Principal) AND Android AND Kotlin

Generate 4 google_xray queries using these strategies:
1. "Exact Role" — site:linkedin.com/in + 1 quoted title + 1-2 skills + country
2. "Stack Search" — site:linkedin.com/in + 2-3 skills + Lead/Senior + country
3. "Broad Title" — site:linkedin.com/in + multiple title variations (OR) + country
4. "Skill Combo" — site:linkedin.com/in + unique skill combination that signals this profile type

For country use "Israel" if domain/context suggests Israel, otherwise omit.

OUTPUT: Return JSON with linkedin_boolean and google_xray arrays, each item has "label" and "query".`,
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