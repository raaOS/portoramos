import React from "react";
import type { ExperienceData } from "@/types/experience";

interface CVTabProps {
    experienceData: ExperienceData | null | undefined;
}

export const CVTab = ({ experienceData }: CVTabProps) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-2xl font-bold text-black">Curriculum Vitae</h1>
        <div className="border-l-2 border-gray-200 pl-4 space-y-6">
            {experienceData?.workExperience.map((job, idx) => (
                <div key={idx}>
                    <h3 className="font-bold text-black">{job.position}</h3>
                    <div className="flex justify-between items-center pr-4">
                        <span className="text-orange-600 text-xs font-semibold">{job.company}</span>
                        <span className="text-gray-400 text-xs">{job.duration} • {job.year}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                        <ul className="list-disc ml-4 space-y-1">
                            {job.description.map((desc, dIdx) => (
                                <li key={dIdx}>{desc}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )) || <p className="text-gray-500 italic">No experience data found.</p>}
        </div>
    </div>
);
