import React from "react";
import type { ExperienceData } from "@/types/experience";

interface CVTabProps {
    experienceData: ExperienceData | null | undefined;
}

export const CVTab = ({ experienceData }: CVTabProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Curriculum Vitae</h1>
        <div className="space-y-8">
            {experienceData?.workExperience.map((job, idx) => (
                <div key={idx} className="group">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{job.position}</h3>
                    <div className="flex flex-col items-start space-y-1">
                        <span className="text-sm font-extrabold text-orange-600">{job.company}</span>
                        <span className="text-[11px] font-semibold text-gray-400/80 uppercase tracking-wider">{job.duration} • {job.year}</span>
                    </div>
                    <div className="mt-4">
                        <ul className="space-y-3">
                            {job.description.map((desc, dIdx) => (
                                <li key={dIdx} className="text-[14px] leading-relaxed text-gray-600/90 text-justify">
                                    {desc}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )) || <p className="text-gray-500 italic">No experience data found.</p>}
        </div>
    </div>
);
