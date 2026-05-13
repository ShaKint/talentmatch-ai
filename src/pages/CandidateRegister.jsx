import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle2, Zap } from 'lucide-react';
import CandidateRegisterStep1 from '@/components/candidate-register/CandidateRegisterStep1';
import CandidateRegisterStep2 from '@/components/candidate-register/CandidateRegisterStep2';
import CandidateRegisterStep3 from '@/components/candidate-register/CandidateRegisterStep3';

const STEPS = ['פרטים אישיים', 'קורות חיים', 'העדפות'];

export default function CandidateRegister() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({
    name: '',
    phone: '',
    profile_url: '',
    cv_file: null,
    cv_file_url: '',
    cv_file_name: '',
    raw_text: '',
    salary_min: '',
    salary_max: '',
    career_stage: '',
    important_factors: [],
    preferred_locations: [],
    preferred_work_model: '',
    open_to_contact: true,
  });

  const update = (fields) => setData((prev) => ({ ...prev, ...fields }));

  const handleSubmit = async () => {
    setLoading(true);
    let cvUrl = data.cv_file_url;
    let cvName = data.cv_file_name;
    let rawText = data.raw_text;

    if (data.cv_file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.cv_file });
      cvUrl = file_url;
      cvName = data.cv_file.name;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Extract all text content from this CV/resume file. Return all the text preserving structure and details.',
        file_urls: [file_url],
        response_json_schema: { type: 'object', properties: { full_text: { type: 'string' } } }
      });
      rawText = result?.full_text || '';
    }

    const candidate = await base44.entities.Candidate.create({
      phone: data.phone,
      profile_url: data.profile_url,
      cv_file_url: cvUrl,
      cv_file_name: cvName,
      raw_text: rawText,
      salary_min: data.salary_min ? Number(data.salary_min) : undefined,
      salary_max: data.salary_max ? Number(data.salary_max) : undefined,
      career_stage: data.career_stage,
      important_factors: data.important_factors,
      preferred_locations: data.preferred_locations,
      preferred_work_model: data.preferred_work_model,
      open_to_contact: data.open_to_contact,
      status: 'pending',
      parsed_profile: { name: data.name },
    });

    // Trigger async analysis
    base44.functions.invoke('analyzeCandidate', { candidate_id: candidate.id }).catch(() => {});

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">הפרופיל שלך נוצר בהצלחה!</h2>
          <p className="text-muted-foreground">המערכת כעת מנתחת את הפרופיל שלך ותתאים לך משרות רלוונטיות. נחזור אליך בקרוב.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-foreground">SourceAI — הרשמת מועמד</span>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-8">
        {/* Steps */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 text-sm font-medium ${i === step ? 'text-primary' : i < step ? 'text-primary/60' : 'text-muted-foreground'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < step ? 'bg-primary border-primary text-white' :
                  i === step ? 'border-primary text-primary' :
                  'border-border text-muted-foreground'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && <CandidateRegisterStep1 data={data} update={update} />}
        {step === 1 && <CandidateRegisterStep2 data={data} update={update} />}
        {step === 2 && <CandidateRegisterStep3 data={data} update={update} />}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            הקודם
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>הבא</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'שולח...' : 'סיים הרשמה'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}