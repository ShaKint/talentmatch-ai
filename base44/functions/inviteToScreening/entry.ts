import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { candidateId, jobId } = await req.json();

    const [candidate, job] = await Promise.all([
      base44.asServiceRole.entities.Candidate.get(candidateId),
      base44.asServiceRole.entities.Job.get(jobId),
    ]);

    if (!candidate || !job) {
      return Response.json({ error: 'Candidate or job not found' }, { status: 404 });
    }

    const isRegistered = !!candidate.user_id;
    const candidateEmail = candidate.created_by || candidate.candidate_email;
    const candidateName = candidate.parsed_profile?.name || 'מועמד';
    const jobTitle = job.title;

    // Check salary alignment
    const jobSalaryMin = job.salary_min || null;
    const jobSalaryMax = job.salary_max || null;
    const candidateSalaryMin = candidate.salary_min || null;
    const candidateSalaryMax = candidate.salary_max || null;

    let salaryGap = null;
    let hasSalaryGap = false;

    if (jobSalaryMin && jobSalaryMax && candidateSalaryMin && candidateSalaryMax) {
      // Gap if candidate min > job max
      if (candidateSalaryMin > jobSalaryMax) {
        salaryGap = candidateSalaryMin - jobSalaryMax;
        hasSalaryGap = true;
      }
    }

    const appBaseUrl = req.headers.get('origin') || 'https://app.base44.com';
    const jobLink = `${appBaseUrl}/job-preview/${jobId}`;

    // Create application record
    const application = await base44.asServiceRole.entities.JobApplication.create({
      job_id: jobId,
      candidate_id: candidateId,
      candidate_email: candidateEmail,
      candidate_name: candidateName,
      status: 'outreach_sent',
      is_registered_candidate: isRegistered,
      job_salary_min: jobSalaryMin,
      job_salary_max: jobSalaryMax,
      candidate_salary_min: candidateSalaryMin,
      candidate_salary_max: candidateSalaryMax,
      salary_gap: salaryGap,
    });

    if (isRegistered) {
      // Send in-app notification via email
      const salaryNote = hasSalaryGap
        ? `\n\nשימ/י לב: קיים פער של ₪${salaryGap.toLocaleString()} בציפיות השכר. אנחנו מבקשים לדעת אם תהי/ה מעוניינ/ת לשוחח בכל זאת.`
        : '';

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: candidateEmail,
        subject: `הזמנה לסקרינינג: ${jobTitle}`,
        body: `שלום ${candidateName},\n\nנמצאה משרה שיכולה להתאים לך: ${jobTitle}.\n\nלצפייה בפרטי המשרה ולהביע עניין: ${jobLink}?app_id=${application.id}${salaryNote}\n\nצוות SourceAI`,
      });
    } else {
      // Unregistered - send email with job link
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: candidateEmail,
        subject: `הזמנה לתפקיד: ${jobTitle}`,
        body: `שלום ${candidateName},\n\nמצאנו תפקיד שיכול להתאים לך: ${jobTitle}.\n\nלצפייה בפרטי המשרה ולהגשת מועמדות:\n${jobLink}?app_id=${application.id}\n\nצוות SourceAI`,
      });
    }

    return Response.json({ success: true, applicationId: application.id, hasSalaryGap, salaryGap });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});