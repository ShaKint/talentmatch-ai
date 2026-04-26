import React, { useState } from 'react';
import CvUploadModal from './CvUploadModal';

export default function JobPageBit({ job }) {
  const [showModal, setShowModal] = useState(false);

  const mustHave = job.parsed_data?.must_have || [];
  const niceToHave = job.parsed_data?.nice_to_have || [];
  const domain = job.parsed_data?.domain || '';
  const seniority = job.parsed_data?.seniority || '';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {domain && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 mb-3">
              {domain}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{job.title}</h1>
          {seniority && <p className="text-gray-500 text-base capitalize mt-1">{seniority}</p>}
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            הגש מועמדות
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Must Have */}
        {mustHave.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-4 uppercase tracking-wide">דרישות חובה</h2>
            <div className="grid gap-2">
              {mustHave.map((req, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs mt-0.5 shrink-0 font-bold">✓</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {req.skill}
                      {req.min_experience_years && (
                        <span className="text-gray-500 font-normal"> — {req.min_experience_years}+ שנים</span>
                      )}
                    </p>
                    {req.context && <p className="text-xs text-gray-400 mt-0.5">{req.context}</p>}
                    {req.alternatives?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">חלופות: {req.alternatives.join(', ')}</p>
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
            <h2 className="text-base font-semibold text-gray-700 mb-4 uppercase tracking-wide">יתרון</h2>
            <div className="flex flex-wrap gap-2">
              {niceToHave.map((req, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-lg border border-slate-200">
                  {req.skill}
                  {req.min_experience_years && ` (${req.min_experience_years}+ שנים)`}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-2">מתאים/ה לתפקיד?</h3>
          <p className="text-gray-500 text-sm mb-6">שלח/י קו"ח ונחזור אליך בהקדם</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
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
          theme="light"
        />
      )}
    </div>
  );
}