import React from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import { getProxiedUrl } from "@/lib/utils";
import type { AboutData } from "@/types/about";
import type { HardSkillsData } from "@/types/hardSkill";

interface AboutTabProps {
    aboutData: AboutData | null | undefined;
    hardSkillsData: HardSkillsData | null | undefined;
}

export const AboutTab = ({ aboutData, hardSkillsData }: AboutTabProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">
                {aboutData?.hero.title || "Fullstack Developer"}
            </h1>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                {aboutData?.professional.bio.content || "Loading..."}
            </p>
        </div>

        <div>
            <h2 className="text-sm font-bold text-black mb-4">I can do...</h2>
            <div className="space-y-6">
                {hardSkillsData?.skills?.filter(s => s.isActive !== false).map((skill, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            {skill.iconUrl && (
                                <Image
                                    src={getProxiedUrl(skill.iconUrl)}
                                    alt={skill.name}
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                />
                            )}
                            <h3 className="font-bold text-gray-900 text-sm">{skill.name}</h3>
                        </div>

                        <div className="pl-7 space-y-1">
                            {skill.details && skill.details.length > 0 ? (
                                skill.details.map((detail, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="flex items-center justify-center w-4 h-4 rounded-full border border-[#42b549] bg-[#42b549]/10 mt-0.5 shrink-0">
                                            <Check size={8} className="text-[#42b549]" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-gray-600 leading-tight">
                                            {detail}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-400 italic">No details available</div>
                            )}
                        </div>
                    </div>
                )) || (
                        <div className="text-gray-400 text-xs italic">No skills data loaded.</div>
                    )}
            </div>
        </div>
    </div>
);
