import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await req.json();

  const job = await base44.entities.Job.get(jobId);

  // Step 1: Parse JD into structured data
  const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an expert technical recruiter in Israel. Parse this job description into a structured format for sourcing candidates on LinkedIn and Google.

JOB DESCRIPTION:
${job.raw_description}

${job.emphasis_notes ? `RECRUITER NOTES: ${job.emphasis_notes}` : ''}

Extract:
1. title - the exact job title
2. seniority - junior/mid/senior/lead/principal/director
3. must_have - array of MUST HAVE skills/requirements. Be VERY SPECIFIC with technologies — not "mobile development" but "Kotlin", "Swift", "KMP", "SwiftUI", "Jetpack Compose". Include exact framework and tool names as they appear on LinkedIn profiles.
4. nice_to_have - array of NICE TO HAVE skills
5. domain - primary domain (e.g. fintech, consumer, enterprise, etc.)
6. management_required - boolean, does this role require people management?
7. alternative_titles - array of 6-8 equivalent job titles a candidate might use on their LinkedIn profile. Think about how real candidates in Israel write their titles — in English and Hebrew transliteration. E.g. for a Mobile Team Lead: ["Mobile Team Lead", "Android Team Lead", "iOS Team Lead", "Mobile Tech Lead", "Fullstack Team Leader", "Engineering Team Lead", "Mobile Engineering Manager", "Tech Lead Mobile"]
8. search_keywords - array of 6-8 short keyword combinations (2-3 words each) that would appear on a matching candidate's LinkedIn profile. These should be SPECIFIC and UNIQUE to this role — not generic words like "developer" or "software engineer". E.g. for this role: ["Kotlin Multiplatform", "KMP", "Jetpack Compose", "SwiftUI", "Spring Boot", "microservices", "Clean Architecture", "mobile architecture"]
9. weights - scoring weights object with these categories that sum to 100:
   - leadership (0-100)
   - primary_stack (0-100) 
   - secondary_stack (0-100)
   - architecture (0-100)
   - cloud_devops (0-100)
   
The weights should reflect the job's priorities. A Team Lead role with 50% hands-on should weight both leadership AND technical skills high.`,
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
        search_keywords: { type: "array", items: { type: "string" } },
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
    prompt: `You are a world-class technical sourcer specializing in the Israeli tech market. Generate PRACTICAL Boolean and X-Ray search queries that return highly relevant candidates on LinkedIn and Google.

CRITICAL RULES — follow strictly:
- LinkedIn Boolean queries MUST be under 200 characters. LinkedIn truncates long queries → zero results.
- Google X-Ray queries MUST be under 180 characters.
- Use ONLY 2-4 key terms per query. More terms = fewer results.
- Use EXACT technology names as they appear on LinkedIn profiles (e.g. "Kotlin Multiplatform" not "cross-platform mobile").
- Each query must use a DIFFERENT STRATEGY to reach different candidate pools.
- For Israel-based roles: always add "Israel" to Google X-Ray queries.
- NEVER use generic terms like "software engineer", "developer", "programming" — they return noise.

JOB DATA:
Title: ${parsed.title}
Key distinguishing skills (use these — they're specific to this role): ${(parsed.search_keywords || parsed.must_have || []).slice(0, 6).join(', ')}
Alternative titles: ${(parsed.alternative_titles || []).slice(0, 5).join(', ')}
Seniority: ${parsed.seniority}
Domain: ${parsed.domain || ''}
Management required: ${parsed.management_required ? 'Yes' : 'No'}

Generate 5 linkedin_boolean queries using these strategies:
1. "Title Focus" — 3-4 title variations only. E.g: ("Mobile Team Lead" OR "Android Team Lead" OR "Mobile Tech Lead")
2. "Primary Stack + Lead" — lead/senior signal AND 2 most unique technical skills for this role
3. "Unique Tech Combo" — 2-3 very specific technologies that ONLY appear together on profiles matching this role (e.g. KMP AND SwiftUI, or Kotlin AND "Spring Boot" AND Lead)
4. "Broad Reach" — slightly broader, catches people with non-standard titles but right skills
5. "Fintech/Domain Signal" — if domain-specific, add domain term + title/skills combo

Generate 5 google_xray queries using these strategies:
1. "Exact Role + Israel" — site:linkedin.com/in + quoted title + Israel
2. "Core Stack + Israel" — site:linkedin.com/in + 2 key technologies + Lead/Senior + Israel  
3. "Unique Skill Combo" — site:linkedin.com/in + most unique skill combination for this role + Israel
4. "Title Variations" — site:linkedin.com/in + OR of title variations + Israel
5. "GitHub/Portfolio Signal" — site:github.com + key technologies for this role (finds active contributors)

OUTPUT: Return JSON with linkedin_boolean and google_xray arrays. Each item: "label" (short strategy name) and "query" (the actual search string, ready to paste).`,
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