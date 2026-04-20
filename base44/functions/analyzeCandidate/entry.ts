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
- skills: array of ALL technical and non-technical skills you can identify (from titles, descriptions, etc.)
- experience_years: estimated total years of experience
- management_years: estimated years of people/team management (0 if none)
- hands_on: boolean - do they appear to be hands-on/coding?
- seniority: junior/mid/senior/lead/principal/director
- domains: array of domains they've worked in (fintech, consumer, enterprise, etc.)
- education: brief education summary
- locations: array of locations mentioned

Be generous with skill extraction - if someone managed Android development, add "Android", "Mobile", "Team Management" etc.
If they used "Spring Boot" also add "Java", "Spring", "Backend" etc.`,
    response_json_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        headline: { type: "string" },
        about: { type: "string" },
        companies: { type: "array", items: { type: "string" } },
        skills: { type: "array", items: { type: "string" } },
        experience_years: { type: "number" },
        management_years: { type: "number" },
        hands_on: { type: "boolean" },
        seniority: { type: "string" },
        domains: { type: "array", items: { type: "string" } },
        education: { type: "string" },
        locations: { type: "array", items: { type: "string" } }
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
   - Match against must_have technologies
   - Consider synonyms and related tech

3. Tech Match - Secondary Stack (weight: secondary_stack=${job.parsed_data.weights?.secondary_stack || 20})
   - Match against nice_to_have technologies
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

Also provide:
- category_scores: object with named category scores (e.g. "Leadership": 90, "Mobile": 85, etc.) - use descriptive names relevant to this specific job
- strengths: array of 3-5 specific reasons this candidate is a good fit
- gaps: array of specific missing requirements or concerns
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
            tech_match: { type: "number" },
            depth_match: { type: "number" },
            context_match: { type: "number" },
            signal_quality: { type: "number" }
          }
        },
        category_scores: { type: "object" },
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