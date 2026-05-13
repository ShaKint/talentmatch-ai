import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function InviteToScreeningButton({ candidate, jobId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null | { hasSalaryGap, salaryGap }
  const queryClient = useQueryClient();

  const candidateName = candidate.parsed_profile?.name || 'המועמד';

  const handleInvite = async () => {
    if (!confirm(`לשלוח הזמנה לסקרינינג ל-${candidateName}?`)) return;
    setLoading(true);
    const res = await base44.functions.invoke('inviteToScreening', {
      candidateId: candidate.id,
      jobId,
    });
    setResult(res.data);
    queryClient.invalidateQueries({ queryKey: ['applications', jobId] });
    setLoading(false);
  };

  if (result) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {result.hasSalaryGap ? (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-amber-600">נשלחה פנייה — פער שכר ₪{result.salaryGap?.toLocaleString()}</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-green-600">הזמנה נשלחה</span>
          </>
        )}
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2 text-primary border-primary/40 hover:bg-primary/10"
      disabled={loading}
      onClick={handleInvite}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
      הזמן לסקרינינג
    </Button>
  );
}