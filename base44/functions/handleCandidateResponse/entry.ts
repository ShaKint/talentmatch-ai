import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called from job preview page when candidate responds to outreach
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { applicationId, interested, declineReason, salaryMin, salaryMax } = await req.json();

    const application = await base44.asServiceRole.entities.JobApplication.get(applicationId);
    if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });

    if (!interested) {
      await base44.asServiceRole.entities.JobApplication.update(applicationId, {
        status: 'candidate_declined',
        candidate_decline_reason: declineReason || 'לא צוינה סיבה',
      });
      return Response.json({ success: true, status: 'declined' });
    }

    // Candidate is interested - check salary
    const updates = {
      status: 'candidate_interested',
      candidate_salary_min: salaryMin,
      candidate_salary_max: salaryMax,
    };

    const jobSalaryMax = application.job_salary_max;
    let salaryGap = null;
    let hasSalaryGap = false;

    if (jobSalaryMax && salaryMin && salaryMin > jobSalaryMax) {
      salaryGap = salaryMin - jobSalaryMax;
      hasSalaryGap = true;
      updates.salary_gap = salaryGap;
      updates.status = 'salary_gap_identified';
    }

    await base44.asServiceRole.entities.JobApplication.update(applicationId, updates);

    // Notify recruiter
    const [job] = await Promise.all([
      base44.asServiceRole.entities.Job.get(application.job_id),
    ]);

    // Get recruiter email (job creator)
    const recruiterEmail = job?.created_by;

    if (recruiterEmail) {
      const salaryNote = hasSalaryGap
        ? `\n\n⚠️ שים/י לב: קיים פער שכר של ₪${salaryGap.toLocaleString()} — המועמד ביקש ${salaryMin?.toLocaleString()}–${salaryMax?.toLocaleString()} ₪ ואתה הגדרת עד ${jobSalaryMax?.toLocaleString()} ₪.\n\nיש לאשר את הפנייה למרות הפער.`
        : '\n\n✅ ציפיות השכר תואמות.';

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recruiterEmail,
        subject: `מועמד מעוניין: ${application.candidate_name} למשרת ${job?.title}`,
        body: `שלום,\n\n${application.candidate_name} הביע/ה עניין במשרת ${job?.title}.${salaryNote}\n\nלאישור הצגת המועמד ניתן להיכנס לדשבורד.\n\nצוות SourceAI`,
      });
    }

    return Response.json({ success: true, status: updates.status, hasSalaryGap, salaryGap });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});