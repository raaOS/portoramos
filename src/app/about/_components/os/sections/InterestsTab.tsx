import React from "react";
import type { AboutData } from "@/types/about";

interface InterestsTabProps {
    aboutData: AboutData | null | undefined;
}

export const InterestsTab = ({ aboutData }: InterestsTabProps) => {
    // Normalize data
    const rawItems = aboutData?.softSkills?.items ||
        (aboutData?.softSkills?.texts?.map((text, i) => ({
            text,
            description: aboutData?.softSkills?.descriptions?.[i] || '',
            isDraft: false
        })) || []);

    // Filter out drafts
    const interests = rawItems.filter(item => !item.isDraft);

    if (interests.length === 0) {
        return (
            <div className="text-gray-400 text-sm italic animate-in fade-in slide-in-from-bottom-2 duration-300">
                No interests to display.
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="text-2xl font-bold text-black mb-6">Interests & Soft Skills</h1>
            <div className="space-y-8">
                {interests.map((item, idx) => (
                    <div key={idx} className="group">
                        <h3 className="font-bold text-black text-lg mb-2 flex items-center gap-2">
                            {item.text}
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
