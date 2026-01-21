"use client";

import React, { useState } from "react";
import { CheckCircle2, User, FileText, Heart } from "lucide-react";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";

interface AboutContentProps {
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
}

export default function AboutContent({ aboutData, experienceData, hardSkillsData }: AboutContentProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'cv' | 'interests'>('about');

    const MenuButton = ({ id, label, count, icon: Icon }: { id: 'about' | 'cv' | 'interests', label: string, count?: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${activeTab === id
                ? "bg-black/10 text-black font-semibold"
                : "text-gray-600 hover:bg-black/5"
                }`}
        >
            <div className="flex items-center gap-2">
                <Icon size={16} />
                <span>{label}</span>
            </div>
            {count && <span className="text-gray-400 text-xs">{count}</span>}
        </button>
    );

    return (
        <div className="flex h-full w-full bg-[#ECECEC] font-sans">
            <style jsx>{`
                .about-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .about-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .about-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 4px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                .about-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0,0,0,0.2);
                }
            `}</style>

            {/* Sidebar (Left) */}
            <div className="w-[180px] shrink-0 bg-[#E3E3E3]/50 border-r border-[#D1D1D1] p-3 flex flex-col gap-1 pt-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-1">
                    Personal
                </div>
                <MenuButton id="about" label="About me" count="18" icon={User} />
                <MenuButton id="cv" label="CV" count={experienceData?.workExperience.length ? String(experienceData.workExperience.length) : "0"} icon={FileText} />
                <MenuButton id="interests" label="Interests" count={aboutData?.softSkills?.texts.length ? "∞" : "0"} icon={Heart} />
            </div>

            {/* Content Area (Right) */}
            <div
                data-lenis-prevent
                className="flex-1 bg-white h-full overflow-y-auto overscroll-contain p-8 pb-20 about-scrollbar min-h-0"
                style={{ touchAction: "pan-y" }}
            >
                {activeTab === 'about' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-black mb-2">
                                {aboutData?.hero.title || "Fullstack Developer"}
                            </h1>
                            <p className="text-gray-500 font-medium mb-4">
                                {aboutData?.professional.motto.badge || "Creative Developer"}
                            </p>
                            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                                {aboutData?.professional.bio.content || "Loading..."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-black mb-3">I can do...</h3>
                            <ul className="space-y-2">
                                {hardSkillsData?.skills?.map((skill, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-orange-400 fill-orange-400/20" />
                                        <span>{skill.name}</span>
                                    </li>
                                )) || (
                                        <li className="text-gray-400 text-xs italic">No skills data loaded.</li>
                                    )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'cv' && (
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
                )}

                {activeTab === 'interests' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h1 className="text-2xl font-bold text-black">Soft Skills & Interests</h1>
                        <div className="grid grid-cols-2 gap-3">
                            {aboutData?.softSkills.texts.map((tag, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                                    <span className="font-semibold text-gray-800 text-sm block mb-1">{tag}</span>
                                    <span className="text-xs text-gray-500">{aboutData.softSkills.descriptions[idx]}</span>
                                </div>
                            )) || <p className="text-gray-500 italic">No interests listed.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
