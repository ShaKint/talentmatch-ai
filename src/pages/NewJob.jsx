import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import JobCreationStep1 from '@/components/job/JobCreationStep1';
import JobCreationStep2 from '@/components/job/JobCreationStep2';
import JobCreationStep3 from '@/components/job/JobCreationStep3';
import TemplateSelector from '@/components/job/TemplateSelector';

export default function NewJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [template, setTemplate] = useState('tech');

  const createMutation = useMutation({
    mutationFn: async () => {
      const job = await base44.entities.Job.create({
        title,
        raw_description: description,
        emphasis_notes: notes,
        design_template: template,
        status: 'parsing',
      });
      await base44.functions.invoke('parseJobDescription', { jobId: job.id });
      return job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${job.id}`);
    },
  });

  const goToStep = (nextStep) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(nextStep);
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

  const totalSteps = 4;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה למשרות
        </button>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">יצירת משרה חדשה</h1>
        <div className="flex items-center gap-2 mt-3">
          {[1, 2, 3, 4].map(num => (
            <React.Fragment key={num}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === num ? 'bg-primary text-primary-foreground' :
                step > num ? 'bg-primary/30 text-primary' :
                'bg-secondary text-muted-foreground'
              }`}>
                {num}
              </div>
              {num < totalSteps && <div className={`flex-1 h-1 ${step > num ? 'bg-primary/30' : 'bg-secondary'} transition-all`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && (
        <JobCreationStep1
          title={title}
          description={description}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onNext={() => goToStep(2)}
        />
      )}

      {step === 2 && (
        <div className="space-y-6">
          <TemplateSelector value={template} onChange={setTemplate} />
          <div className="flex justify-between pt-4 border-t border-border">
            <button onClick={() => goToStep(1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
              <ArrowRight className="w-4 h-4" />
              חזור לשלב 1
            </button>
            <button
              onClick={() => goToStep(3)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              המשך לשלב 3
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <JobCreationStep2
          notes={notes}
          onNotesChange={setNotes}
          onBack={() => goToStep(2)}
          onNext={() => goToStep(4)}
          title={title}
        />
      )}

      {step === 4 && (
        <JobCreationStep3
          title={title}
          description={description}
          notes={notes}
          isLoading={createMutation.isPending}
          onBack={() => goToStep(3)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}