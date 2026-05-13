import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called when recruiter or candidate approves salary gap
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { applicationId, approverRole } = await req.json(); // approverRole: 'recruiter' | 'candidate'

    const application = await base44.asServiceRole.entities.JobApplication.get(applicationId);
    if (!application) return Response.json({ error: 'Not found' }, { status: 404 });

    const updates = {};
    if (approverRole === 'recruiter') {
      updates.recruiter_approved_gap = true;
    } else {
      updates.candidate_approved_gap = true;
    }

    // If both approved → move to presented_to_recruiter
    const recruiterApproved = approverRole === 'recruiter' ? true : application.recruiter_approved_gap;
    const candidateApproved = approverRole === 'candidate' ? true : application.candidate_approved_gap;

    if (recruiterApproved && candidateApproved) {
      updates.status = 'presented_to_recruiter';

      // Notify recruiter
      const job = await base44.asServiceRole.entities.Job.get(application.job_id);
      const recruiterEmail = job?.created_by;
      if (recruiterEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recruiterEmail,
          subject: `מועמד מאושר: ${application.candidate_name} למשרת ${job?.title}`,
          body: `שלום,\n\nהמועמד ${application.candidate_name} אושר לפגישת סקרינינג למשרת ${job?.title}.\nשני הצדדים הסכימו למרות פער שכר של ₪${application.salary_gap?.toLocaleString()}.\n\nהמועמד זמין לפגישה.\n\nצוות SourceAI`,
        });
      }
    } else {
      updates.status = 'salary_gap_identified'; // Still waiting for the other side
    }

    await base44.asServiceRole.entities.JobApplication.update(applicationId, updates);

    return Response.json({ success: true, status: updates.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});