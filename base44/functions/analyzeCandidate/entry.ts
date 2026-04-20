import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { candidateId } = await req.json();

  const candidate = await base44.entities.Candidate.get(candidateId);
  const job = await base44.entities.Job.get(candidate.job_id);

  if (!job.parsed_data) {
    return Response.json({ error: 'Job has not been parsed yet' }, { status: 400 });
  }

  // Step 1: Parse profile
  const profileText = candidate.raw_text || `LinkedIn Profile URL: ${candidate.profile_url}`;

  const parsedProfile = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an expert technical recruiter analyzing a candidate profile.

PROFILE DATA:
${profileText}

Extract structured data from this profile. Be thorough and infer where possible:
- name: full name
- headline: their current headline/title
- about: summary of their about section
- companies: array of company names they've worked at
- skills: array of ALL technical skills with SPECIFIC VERSIONS where mentioned (e.g. "React 18", "Python 3.10", "Spring Boot 3.x", "Kubernetes 1.28", "Java 17"). If no version is mentioned, just use the name.
- tech_stack_detailed: object with keys "languages", "frameworks", "databases", "cloud", "tools" — each is an array of strings with versions where known
- experience_years: estimated total years of experience
- management_years: estimated years of people/team management (0 if none)
- hands_on: boolean - do they appear to be hands-on/coding?
- seniority: junior/mid/senior/lead/principal/director
- domains: array of domains they've worked in (fintech, consumer, enterprise, etc.)
- education: brief education summary
- locations: array of locations mentioned
- soft_skills: array of soft skills EXPLICITLY or IMPLICITLY evidenced in the profile text. 
  Look for signals like: "led a team of X" → Leadership, "collaborated cross-functionally" → Cross-functional collaboration,
  "delivered under tight deadlines" → Execution under pressure, "mentored junior developers" → Mentorship,
  "presented to stakeholders" → Communication, "drove architecture decisions" → Technical leadership, etc.
  Each item should be a short label + evidence string, e.g. "Leadership — managed team of 8 engineers"

Be precise with tech versions. If the text says "worked with Python" with no version, output "Python". 
If it says "Python 3" or "Python 3.9", output exactly that.`,
    response_json_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        headline: { type: "string" },
        about: { type: "string" },
        companies: { type: "array", items: { type: "string" } },
        skills: { type: "array", items: { type: "string" } },
        tech_stack_detailed: {
          type: "object",
          properties: {
            languages:  { type: "array", items: { type: "string" } },
            frameworks: { type: "array", items: { type: "string" } },
            databases:  { type: "array", items: { type: "string" } },
            cloud:      { type: "array", items: { type: "string" } },
            tools:      { type: "array", items: { type: "string" } }
          }
        },
        experience_years: { type: "number" },
        management_years: { type: "number" },
        hands_on: { type: "boolean" },
        seniority: { type: "string" },
        domains: { type: "array", items: { type: "string" } },
        education: { type: "string" },
        locations: { type: "array", items: { type: "string" } },
        soft_skills: { type: "array", items: { type: "string" } }
      }
    }
  });

  // Step 2: Run matching engine
  const matchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a precise recruiting matching engine. Score this candidate against this job using a weighted scoring model.

JOB REQUIREMENTS:
${JSON.stringify(job.parsed_data, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(parsedProfile, null, 2)}

SCORING MODEL (use these exact weights from the job):
${JSON.stringify(job.parsed_data.weights, null, 2)}

Score each category from 0-100:

1. Core Match (weight: leadership=${job.parsed_data.weights?.leadership || 25})
   - Similar role/title match
   - Appropriate seniority level
   - Management experience if required
   - Primary domain alignment

2. Tech Match - Primary Stack (weight: primary_stack=${job.parsed_data.weights?.primary_stack || 30})
   - Match against must_have technologies WITH VERSION AWARENESS:
     * Exact version match = full score
     * Same major version = 90% score  
     * Same technology, no version info = 75% score
     * Older major version = 50% score
     * Missing technology = 0% score
   - Use tech_stack_detailed for precision

3. Tech Match - Secondary Stack (weight: secondary_stack=${job.parsed_data.weights?.secondary_stack || 20})
   - Match against nice_to_have technologies (same version-aware logic)
   - Bonus for additional relevant skills

4. Architecture/Depth (weight: architecture=${job.parsed_data.weights?.architecture || 15})
   - System design, architecture experience
   - Scale, distributed systems
   - Hands-on evidence

5. Cloud/DevOps (weight: cloud_devops=${job.parsed_data.weights?.cloud_devops || 10})
   - Cloud platforms
   - CI/CD, Kubernetes, Docker
   - DevOps practices

CRITICAL RULES:
- must_have items that are MISSING should significantly reduce the score
- nice_to_have items that are PRESENT should boost the score
- "Team Lead" without formal title but with evidence of leadership still counts
- Tech synonyms count (Java/Spring/APIs = Backend evidence)
- Be strict but fair
- overall_score = weighted average of all category scores
- When scoring tech, note specific version matches/mismatches in strengths/gaps
- breakdown: object with these EXACT number fields (each 0-100):
  * core_match (leadership/role fit score)
  * primary_stack (must_have tech score)
  * secondary_stack (nice_to_have tech score)
  * depth_match (architecture/depth score)
  * cloud_devops (cloud/devops score)

Also provide:
- category_scores: object with named category scores (e.g. "Leadership": 90, "Mobile": 85, etc.) - use descriptive names relevant to this specific job
- tech_comparison: array of objects comparing each must_have tech vs what the candidate has. Each item: { required, candidate_has, match_level ("exact"|"partial"|"missing"), note }
- soft_skills_assessment: 2-3 sentence analysis of the candidate's soft skills relevance to this role, based on soft_skills array
- strengths: array of 3-5 specific reasons this candidate is a good fit (mention specific versions when relevant)
- gaps: array of specific missing requirements or concerns (mention version gaps when relevant)
- recommendation: a 2-3 sentence assessment
- recommendation_level: one of "strong_fit", "good_fit", "partial_fit", "weak_fit"`,
    response_json_schema: {
      type: "object",
      properties: {
        overall_score: { type: "number" },
        breakdown: {
          type: "object",
          properties: {
            core_match: { type: "number" },
            primary_stack: { type: "number" },
            secondary_stack: { type: "number" },
            depth_match: { type: "number" },
            cloud_devops: { type: "number" }
          }
        },
        category_scores: { type: "object" },
        tech_comparison: {
          type: "array",
          items: {
            type: "object",
            properties: {
              required: { type: "string" },
              candidate_has: { type: "string" },
              match_level: { type: "string" },
              note: { type: "string" }
            }
          }
        },
        soft_skills_assessment: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
        recommendation_level: { type: "string" }
      }
    }
  });

  // Update candidate
  await base44.asServiceRole.entities.Candidate.update(candidateId, {
    parsed_profile: parsedProfile,
    match_result: matchResult,
    status: 'matched'
  });

  return Response.json({ parsed_profile: parsedProfile, match_result: matchResult });
});