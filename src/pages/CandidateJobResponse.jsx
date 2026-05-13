import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2, Briefcase, AlertTriangle } from 'lucide-react';

export default function CandidateJobResponse() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id') || window.location.pathname.split('/job-preview/')[1]?.split('?')[0];
  const applicationId = urlParams.get('app_id');

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // 'interested' | 'declined'
  const [interested, setInterested] = useState(null);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    base44.functions.invoke('getPublicJob', { jobId })
      .then(res => { if (res.data && !res.data.error) setJob(res.data); })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async () => {
    if (!applicationId) return;
    setSubmitting(true);
    const res = await base44.functions.invoke('handleCandidateResponse', {
      applicationId,
      interested,
      declineReason: interested ? null : declineReason,
      salaryMin: interested ? Number(salaryMin) : null,
      salaryMax: interested ? Number(salaryMax) : null,
    });
    setResult(res.data);
    setDone(interested ? 'interested' : 'declined');
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-950 text-white">
        <span className="text-4xl">🔍</span>
        <p className="text-lg">המשרה לא נמצאה</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="max-w-lg w-full space-y-6">
        {/* Job info */}
        <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{job.title}</h1>
              <p className="text-sm text-gray-400">הוזמנת לסקרינינג עבור משרה זו</p>
            </div>
          </div>
          {job.parsed_data?.seniority && (
            <p className="text-sm text-gray-400">רמה: {job.parsed_data.seniority}</p>
          )}
          {job.parsed_data?.domain && (
            <p className="text-sm text-gray-400">תחום: {job.parsed_data.domain}</p>
          )}
        </div>

        {done === null && applicationId && (
          <>
            {/* Step 1: Are you interested? */}
            {interested === null && (
              <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-lg font-semibold">האם המשרה מעניינת אותך?</h2>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white gap-2"
                    onClick={() => setInterested(true)}
                  >
                    <CheckCircle className="w-4 h-4" /> כן, מעוניינ/ת
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
                    onClick={() => setInterested(false)}
                  >
                    <XCircle className="w-4 h-4" /> לא תודה
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2a: Interested - salary */}
            {interested === true && (
              <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-lg font-semibold">מה ציפיות השכר שלך? (ברוטו חודשי)</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 text-sm mb-1 block">מינימום (₪)</Label>
                    <Input
                      type="number"
                      placeholder="15,000"
                      value={salaryMin}
                      onChange={e => setSalaryMin(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-sm mb-1 block">מקסימום (₪)</Label>
                    <Input
                      type="number"
                      placeholder="22,000"
                      value={salaryMax}
                      onChange={e => setSalaryMax(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                    disabled={!salaryMin || !salaryMax || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שלח תגובה'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-400"
                    onClick={() => setInterested(null)}
                  >
                    חזור
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2b: Not interested - reason */}
            {interested === false && (
              <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-lg font-semibold">מה הסיבה לסירוב? (אופציונלי)</h2>
                <Textarea
                  placeholder="למשל: עסוק כרגע, שכר לא מתאים, תחום לא רלוונטי..."
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white min-h-[80px]"
                />
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שלח'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-400"
                    onClick={() => setInterested(null)}
                  >
                    חזור
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Done: interested */}
        {done === 'interested' && (
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-teal-700 space-y-3 text-center">
            {result?.hasSalaryGap ? (
              <>
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="text-lg font-semibold text-amber-300">קיים פער בציפיות השכר</h2>
                <p className="text-gray-300 text-sm">
                  ציינת ציפיות שכר הגבוהות ב-₪{result.salaryGap?.toLocaleString()} מהמוגדר למשרה.
                  אנחנו נפנה אליך אם המגייסת תאשר את הפנייה.
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-10 h-10 text-teal-400 mx-auto" />
                <h2 className="text-lg font-semibold">תגובתך התקבלה!</h2>
                <p className="text-gray-300 text-sm">המגייסת תיצור איתך קשר בהקדם.</p>
              </>
            )}
          </div>
        )}

        {/* Done: declined */}
        {done === 'declined' && (
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 space-y-3 text-center">
            <XCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <h2 className="text-lg font-semibold">תודה על תגובתך</h2>
            <p className="text-gray-300 text-sm">נרשם שאינך מעוניינ/ת במשרה כרגע. נשמח לפנות שוב בעתיד.</p>
          </div>
        )}

        {/* No app_id - just show job preview */}
        {!applicationId && (
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm text-center">זהו עמוד הצגת המשרה. לא נמצא קישור פנייה תקף.</p>
          </div>
        )}
      </div>
    </div>
  );
}