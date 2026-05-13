import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, AlertTriangle, CheckCircle, XCircle, Clock, Users, ThumbsUp, Loader2 } from 'lucide-react';

const statusConfig = {
  outreach_sent:        { label: 'פנייה נשלחה',       color: 'bg-blue-100 text-blue-700',    icon: Mail },
  candidate_interested: { label: 'מעוניין',           color: 'bg-green-100 text-green-700',  icon: ThumbsUp },
  candidate_declined:   { label: 'סירב',              color: 'bg-red-100 text-red-700',      icon: XCircle },
  salary_gap_identified:{ label: 'פער שכר',           color: 'bg-amber-100 text-amber-700',  icon: AlertTriangle },
  recruiter_approved_gap:{ label: 'מגייסת אישרה פער', color: 'bg-orange-100 text-orange-700',icon: AlertTriangle },
  candidate_approved_gap:{ label: 'מועמד אישר פער',   color: 'bg-purple-100 text-purple-700',icon: AlertTriangle },
  approved:             { label: 'מאושר',             color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  presented_to_recruiter:{ label: 'הוצג למגייסת',    color: 'bg-teal-100 text-teal-700',    icon: Users },
};

export default function Applications() {
  const [filterJob, setFilterJob] = useState('all');
  const [approvingId, setApprovingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.JobApplication.list('-created_date', 100),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
  });

  const filtered = applications.filter(a => filterJob === 'all' || a.job_id === filterJob);

  const getJobTitle = (jobId) => jobs.find(j => j.id === jobId)?.title || jobId;

  const handleApproveGap = async (applicationId) => {
    setApprovingId(applicationId);
    await base44.functions.invoke('approveGap', {
      applicationId,
      approverRole: 'recruiter',
    });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    setApprovingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פניות מועמדים</h1>
          <p className="text-sm text-muted-foreground mt-1">מעקב אחר הזמנות לסקרינינג וסטטוס תגובות</p>
        </div>
        <Select value={filterJob} onValueChange={setFilterJob}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="כל המשרות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המשרות</SelectItem>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">אין פניות עדיין</h3>
          <p className="text-muted-foreground text-sm">שלח הזמנות לסקרינינג מדף המשרה או מדף המועמדים</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const s = statusConfig[app.status] || statusConfig.outreach_sent;
            const StatusIcon = s.icon;
            const showApproveGap = app.status === 'salary_gap_identified' && !app.recruiter_approved_gap;

            return (
              <div key={app.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-semibold text-foreground">{app.candidate_name || app.candidate_email}</h3>
                    <p className="text-sm text-muted-foreground">{getJobTitle(app.job_id)}</p>
                    {app.candidate_email && (
                      <p className="text-xs text-muted-foreground/70">{app.candidate_email}</p>
                    )}
                  </div>
                  <Badge className={`${s.color} flex items-center gap-1 shrink-0`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.label}
                  </Badge>
                </div>

                {/* Salary info */}
                {(app.candidate_salary_min || app.job_salary_min) && (
                  <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/30 rounded-lg p-3">
                    {app.job_salary_min && (
                      <div>
                        <span className="text-muted-foreground text-xs block">טווח משרה</span>
                        <span className="font-medium">₪{app.job_salary_min?.toLocaleString()}–{app.job_salary_max?.toLocaleString()}</span>
                      </div>
                    )}
                    {app.candidate_salary_min && (
                      <div>
                        <span className="text-muted-foreground text-xs block">ציפיית מועמד</span>
                        <span className="font-medium">₪{app.candidate_salary_min?.toLocaleString()}–{app.candidate_salary_max?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Salary gap alert */}
                {app.salary_gap > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700">פער שכר: ₪{app.salary_gap?.toLocaleString()}</p>
                    {app.recruiter_approved_gap && <Badge className="bg-amber-100 text-amber-700 text-xs mr-auto">מגייסת אישרה</Badge>}
                    {app.candidate_approved_gap && <Badge className="bg-purple-100 text-purple-700 text-xs">מועמד אישר</Badge>}
                  </div>
                )}

                {/* Decline reason */}
                {app.status === 'candidate_declined' && app.candidate_decline_reason && (
                  <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                    סיבת סירוב: {app.candidate_decline_reason}
                  </p>
                )}

                {/* Actions */}
                {showApproveGap && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={approvingId === app.id}
                      onClick={() => handleApproveGap(app.id)}
                    >
                      {approvingId === app.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      אשר פנייה למרות פער השכר
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}