import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { getProxiedUrl } from "@/lib/utils";
import type { AboutData } from "@/types/about";
import type { HardSkillsData } from "@/types/hardSkill";

interface InterestsTabProps {
    aboutData: AboutData | null | undefined;
    hardSkillsData: HardSkillsData | null | undefined;
}

export const InterestsTab = ({ aboutData, hardSkillsData }: InterestsTabProps) => {
    // Normalize soft skills data
    const rawItems = aboutData?.softSkills?.items ||
        (aboutData?.softSkills?.texts?.map((text, i) => ({
            text,
            description: aboutData?.softSkills?.descriptions?.[i] || '',
            isDraft: false
        })) || []);

    // Filter out drafts
    const softSkills = rawItems.filter(item => !item.isDraft);
    const hardSkills = hardSkillsData?.skills?.filter(s => s.isActive !== false) || [];

    if (softSkills.length === 0 && hardSkills.length === 0) {
        return (
            <div className="text-gray-400 text-sm italic animate-in fade-in slide-in-from-bottom-2 duration-300">
                No skills to display.
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-black mb-6">Skillset</h1>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Kombinasi keahlian teknis dan interpersonal yang saya gunakan untuk membangun solusi berkualitas.
                </p>
            </div>

            {/* Hard Skills Section */}
            {hardSkills.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Technical Stack</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hardSkills.map((skill, idx) => (
                            <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/30 group hover:bg-white hover:border-[#42b549]/20 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    {skill.iconUrl && (
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100">
                                            <Image
                                                src={getProxiedUrl(skill.iconUrl)}
                                                alt={skill.name}
                                                width={20}
                                                height={20}
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-gray-900 text-sm">{skill.name}</h3>
                                </div>

                                <div className="space-y-1.5">
                                    {skill.details?.map((detail, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-[#42b549] bg-[#42b549]/10 mt-0.5 shrink-0">
                                                <Check size={8} className="text-[#42b549]" strokeWidth={3} />
                                            </div>
                                            <span className="text-xs text-gray-600 leading-tight">
                                                {detail}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Soft Skills Section */}
            {softSkills.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-gray-100">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Interpersonal Skills</h2>
                    <div className="space-y-8">
                        {softSkills.map((item, idx) => (
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
            )}
        </div>
    );
};
