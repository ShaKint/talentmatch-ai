import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const statusConfig = {
  draft: { label: 'טיוטה', className: 'bg-muted text-muted-foreground' },
  parsing: { label: 'מעבד...', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  active: { label: 'פעיל', className: 'bg-accent/10 text-accent border-accent/20' },
  closed: { label: 'סגור', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function Jobs() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">משרות</h1>
          <p className="text-muted-foreground mt-1">ניהול משרות ושאילתות חיפוש</p>
        </div>
        <Link to="/jobs/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            משרה חדשה
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
              <div className="h-5 bg-secondary rounded w-2/3 mb-3" />
              <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
              <div className="h-4 bg-secondary rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">אין משרות עדיין</h3>
          <p className="text-muted-foreground mb-6">צור את המשרה הראשונה שלך כדי להתחיל לחפש מועמדים</p>
          <Link to="/jobs/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              צור משרה
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job, idx) => {
            const status = statusConfig[job.status] || statusConfig.draft;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/jobs/${job.id}`}>
                  <div className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(job.created_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>

                    {job.parsed_data && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.parsed_data.must_have?.slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md">
                            {skill}
                          </span>
                        ))}
                        {(job.parsed_data.must_have?.length || 0) > 4 && (
                          <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-md">
                            +{job.parsed_data.must_have.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{job.candidate_count || 0} מועמדים</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs">צפה</span>
                        <ArrowLeft className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}