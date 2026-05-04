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
  3. must_have - array of MUST HAVE skills/requirements. Each item should be an OBJECT with:
   - skill: the skill/technology name (SPECIFIC - "Kotlin" not "mobile development")
   - min_experience_years: approximate minimum years needed to be competent (this is a PROXY for depth, not a hard cutoff)
   - flexibility_level: "high" (can substitute with similar), "medium" (some flexibility), or "low" (hard requirement)
   - context: explain what this skill REALLY means for this role (e.g., "Lead-level Kotlin for complex architecture" or "Hands-on Java experience for backend development")
   - alternatives: array of 2-3 similar skills that could work instead
  4. nice_to_have - array of NICE TO HAVE skills, same structure as must_have
  5. domain - primary domain (e.g. fintech, consumer, enterprise, etc.)
  6. management_required - boolean, does this role require people management?
  7. alternative_titles - array of 6-8 equivalent job titles a candidate might use on their LinkedIn profile
  8. search_keywords - array of 6-8 short keyword combinations (2-3 words each)
  9. weights - scoring weights object with these categories that sum to 100:
    - leadership (0-100)
    - primary_stack (0-100) 
    - secondary_stack (0-100)
    - architecture (0-100)
    - cloud_devops (0-100)

  IMPORTANT: When extracting years of experience like "10 years of Kotlin", translate that to min_experience_years, but also explain the CONTEXT of what that really means for the role. Years are a proxy — 9 years might be perfectly fine if the depth is there.`,
     response_json_schema: {
       type: "object",
       properties: {
         title: { type: "string" },
         seniority: { type: "string" },
         must_have: {
           type: "array",
           items: {
             type: "object",
             properties: {
               skill: { type: "string" },
               min_experience_years: { type: "number" },
               flexibility_level: { type: "string", enum: ["high", "medium", "low"] },
               context: { type: "string" },
               alternatives: { type: "array", items: { type: "string" } }
             }
           }
         },
         nice_to_have: {
           type: "array",
           items: {
             type: "object",
             properties: {
               skill: { type: "string" },
               min_experience_years: { type: "number" },
               context: { type: "string" },
               alternatives: { type: "array", items: { type: "string" } }
             }
           }
         },
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

  // Extract location constraints from must_have
  const locationKeywords = ['israel', 'tel aviv', 'jerusalem', 'haifa', 'remote', 'hybrid', 'on-site', 'onsite', 'usa', 'uk', 'europe', 'new york', 'london', 'berlin', 'amsterdam'];
  const locationRequirements = (parsed.must_have || []).filter(item =>
    locationKeywords.some(loc => item.skill?.toLowerCase().includes(loc))
  );
  const locationStr = locationRequirements.length > 0
    ? `LOCATION REQUIREMENT (MUST include in ALL queries): ${locationRequirements.map(i => i.skill).join(', ')}`
    : 'Location: Israel (default — add "Israel" to all Google X-Ray queries)';

  // Step 2: Generate search queries
  const queries = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a world-class technical sourcer specializing in the Israeli tech market. Generate PRACTICAL Boolean and X-Ray search queries that return highly relevant candidates on LinkedIn and Google.

CRITICAL RULES — follow strictly:
- LinkedIn Boolean queries MUST be under 200 characters. LinkedIn truncates long queries → zero results.
- Google X-Ray queries MUST be under 180 characters.
- Use ONLY 2-4 key terms per query. More terms = fewer results.
- Use EXACT technology names as they appear on LinkedIn profiles (e.g. "Kotlin Multiplatform" not "cross-platform mobile").
- Each query must use a DIFFERENT STRATEGY to reach different candidate pools.
- NEVER use generic terms like "software engineer", "developer", "programming" — they return noise.
- ${locationStr}

JOB DATA:
Title: ${parsed.title}
Key distinguishing skills (use these — they're specific to this role): ${(parsed.search_keywords || []).slice(0, 6).join(', ')}
Must-have skills: ${(parsed.must_have || []).map(m => m.skill).slice(0, 5).join(', ')}
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