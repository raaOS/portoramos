import React from 'react';
import type { ExperienceData } from '@/types/experience';

interface CVTabProps {
  experienceData: ExperienceData | null | undefined;
}

export const CVTab = ({ experienceData }: CVTabProps) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
    <h1 className="text-xl font-bold tracking-tight text-gray-900">Curriculum Vitae</h1>
    <div className="space-y-8">
      {experienceData?.workExperience.map((job, idx) => (
        <div key={idx} className="group">
          <h3 className="mb-1 text-lg font-bold text-gray-900">{job.position}</h3>
          <div className="flex flex-col items-start space-y-1">
            <span className="text-sm font-extrabold text-orange-600">{job.company}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400/80">
              {job.duration} • {job.year}
            </span>
          </div>
          <div className="mt-4">
            <ul className="space-y-3">
              {job.description.map((desc, dIdx) => (
                <li
                  key={dIdx}
                  className="text-justify text-[14px] leading-relaxed text-gray-600/90"
                >
                  {desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )) || <p className="italic text-gray-500">No experience data found.</p>}
    </div>
  </div>
);
