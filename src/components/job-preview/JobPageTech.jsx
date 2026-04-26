import React, { useState } from 'react';
import CvUploadModal from './CvUploadModal';

export default function JobPageTech({ job }) {
  const [showModal, setShowModal] = useState(false);

  const mustHave = job.parsed_data?.must_have || [];
  const niceToHave = job.parsed_data?.nice_to_have || [];
  const domain = job.parsed_data?.domain || '';
  const seniority = job.parsed_data?.seniority || '';

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black border-b border-gray-800">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #14b8a6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)' }} />
        <div className="relative max-w-3xl mx-auto px-6 py-16 text-center">
          {domain && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-4">
              {domain}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            {job.title}
          </h1>
          {seniority && (
            <p className="text-gray-400 text-lg capitalize">{seniority}</p>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-400/30 hover:-translate-y-0.5"
          >
            <span>הגש מועמדות</span>
            <span>←</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Must Have */}
        {mustHave.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-teal-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              דרישות חובה
            </h2>
            <div className="grid gap-3">
              {mustHave.map((req, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-xs mt-0.5 shrink-0">✓</span>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {req.skill}
                      {req.min_experience_years && (
                        <span className="text-gray-400 font-normal"> — {req.min_experience_years}+ שנים</span>
                      )}
                    </p>
                    {req.context && <p className="text-xs text-gray-500 mt-0.5">{req.context}</p>}
                    {req.alternatives?.length > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">חלופות: {req.alternatives.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nice to Have */}
        {niceToHave.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-indigo-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              יתרון
            </h2>
            <div className="flex flex-wrap gap-2">
              {niceToHave.map((req, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm rounded-lg">
                  {req.skill}
                  {req.min_experience_years && ` (${req.min_experience_years}+ שנים)`}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">מתאים/ה לתפקיד?</h3>
          <p className="text-gray-400 text-sm mb-6">שלח/י קו"ח ונחזור אליך בהקדם</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25"
          >
            הגש מועמדות עכשיו
          </button>
        </div>
      </div>

      {showModal && (
        <CvUploadModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setShowModal(false)}
          theme="dark"
        />
      )}
    </div>
  );
}