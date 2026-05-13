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
  draft: { label: 'טיוטה', className: 'border-gray-200 text-gray-500 bg-gray-50' },
  parsing: { label: 'מעבד...', className: 'border-amber-200 text-amber-600 bg-amber-50' },
  active: { label: 'פעיל', className: 'border-teal-200 text-teal-700 bg-teal-50' },
  closed: { label: 'סגור', className: 'border-red-200 text-red-600 bg-red-50' },
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
          <h1 className="text-3xl font-bold tracking-tight" style={{color:'#1A2332'}}>משרות</h1>
          <p className="mt-1 text-sm" style={{color:'#64748B'}}>ניהול משרות ושאילתות חיפוש</p>
        </div>
        <Link to="/jobs/new">
          <Button className="gap-2 text-white font-semibold rounded-xl px-5" style={{backgroundColor:'#14B8A6', border:'none'}}>
            <Plus className="w-4 h-4" />
            משרה חדשה
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse shadow-sm">
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <Briefcase className="w-16 h-16 mx-auto mb-4" style={{color:'#94A3B8'}} />
          <h3 className="text-xl font-semibold mb-2" style={{color:'#1A2332'}}>אין משרות עדיין</h3>
          <p className="mb-6 text-sm" style={{color:'#64748B'}}>צור את המשרה הראשונה שלך כדי להתחיל לחפש מועמדים</p>
          <Link to="/jobs/new">
            <Button className="gap-2 text-white rounded-xl" style={{backgroundColor:'#14B8A6', border:'none'}}>
              <Plus className="w-4 h-4" />
              צור משרה
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
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
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-teal-200 transition-all duration-200 group cursor-pointer shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className={`text-xs font-medium rounded-full px-3 py-1 ${status.className}`}>
                        {status.label}
                      </Badge>
                      <p className="text-xs" style={{color:'#94A3B8'}}>{format(new Date(job.created_date), 'dd/MM/yyyy')}</p>
                    </div>

                    <h3 className="font-bold text-xl mb-3 text-right" style={{color:'#1A2332'}}>{job.title}</h3>

                    {job.parsed_data?.must_have?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4 justify-end">
                        {job.parsed_data.must_have.slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2.5 py-0.5 text-xs rounded-full border" style={{backgroundColor:'#F1F5F9', color:'#475569', borderColor:'#E2E8F0'}}>
                            {typeof skill === 'object' ? skill.skill : skill}
                          </span>
                        ))}
                        {job.parsed_data.must_have.length > 4 && (
                          <span className="px-2.5 py-0.5 text-xs rounded-full border" style={{backgroundColor:'#F1F5F9', color:'#94A3B8', borderColor:'#E2E8F0'}}>
                            +{job.parsed_data.must_have.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="rounded-xl p-4 flex items-center justify-end gap-2" style={{backgroundColor:'#F8FAFC'}}>
                      <span className="text-2xl font-bold" style={{color:'#1A2332'}}>{job.candidate_count || 0}</span>
                      <div className="flex items-center gap-1" style={{color:'#94A3B8'}}>
                        <Users className="w-5 h-5" />
                        <span className="text-sm">מועמדים</span>
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