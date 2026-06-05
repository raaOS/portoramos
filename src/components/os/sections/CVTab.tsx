import React from 'react';
import type { ExperienceData } from '@/types/experience';

interface CVTabProps {
  experienceData: ExperienceData | null | undefined;
}

export const CVTab = ({ experienceData }: CVTabProps) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 min-w-0 space-y-6 duration-500">
    <h1 className="about-heading break-words text-xl font-bold tracking-tight text-gray-900">
      Curriculum Vitae
    </h1>
    <div className="cv-grid">
      {experienceData?.workExperience.map((job, idx) => (
        <article
          key={idx}
          className="group cv-card flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-gray-50/30 p-5 transition-all duration-300 hover:border-black/10 hover:bg-white"
        >
          <div className="flex flex-col">
            <h3 className="break-words text-base font-semibold tracking-tight text-gray-900">
              {job.position}
            </h3>
            <div className="mt-0.5 break-words text-[15px] text-gray-800">
              {job.company}
            </div>
            <div className="mt-0.5 break-words text-sm text-gray-500">
              {job.year} <span className="mx-1">·</span> {job.duration}
            </div>
          </div>
          <div className="mt-4 pt-2">
            <ul className="space-y-2.5">
              {job.description.map((desc, dIdx) => (
                <li
                  key={dIdx}
                  className="break-words text-left text-[14px] leading-relaxed text-gray-600/90"
                >
                  {desc}
                </li>
              ))}
            </ul>
          </div>
        </article>
      )) || <p className="italic text-gray-500">No experience data found.</p>}
    </div>
  </div>
);
