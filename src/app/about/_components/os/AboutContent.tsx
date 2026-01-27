import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, User, FileText, Heart, Lightbulb, Archive, ExternalLink } from "lucide-react";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project } from "@/types/projects";

interface AboutContentProps {
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects?: Project[];
}

export default function AboutContent({ aboutData, experienceData, hardSkillsData, projects = [] }: AboutContentProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'cv' | 'philosophy' | 'interests' | 'archive'>('about');
    const [activeInterest, setActiveInterest] = useState(0);

    const archiveProjects = projects.filter(p => p.type === 'visual_art');

    const MenuButton = ({ id, label, count, icon: Icon }: { id: typeof activeTab, label: string, count?: string, icon: any }) => (
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
                <MenuButton id="philosophy" label="Philosophy" count="3" icon={Lightbulb} />
                <MenuButton id="interests" label="Interests" count={(aboutData?.softSkills?.items?.length || aboutData?.softSkills?.texts?.length) ? "∞" : "0"} icon={Heart} />

                <div className="h-px bg-gray-300 my-2 mx-1 opacity-50"></div>

                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-1">
                    Works
                </div>
                <MenuButton id="archive" label="Archive" count={String(archiveProjects.length)} icon={Archive} />

                <div className="mt-auto pt-4">
                    <Link
                        href="/cv?mode=ats&print=true"
                        target="_blank"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-gray-600 hover:bg-red-600 hover:text-white active:bg-red-700 active:text-white"
                    >
                        <FileText size={16} />
                        <span>Download CV</span>
                    </Link>
                </div>
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

                {activeTab === 'philosophy' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-black mb-2">
                                {aboutData?.designPhilosophy?.heading || "Design Philosophy"}
                            </h1>
                            <p className="text-gray-600 font-medium">
                                {aboutData?.designPhilosophy?.subheading || "Creating meaningful experiences through thoughtful design"}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {aboutData?.designPhilosophy?.steps.map((step, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-orange-500 font-bold font-mono text-lg">{step.number}</span>
                                        <h3 className="font-bold text-gray-900">{step.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                        {step.desc}
                                    </p>
                                    <div className="text-xs text-gray-500 italic border-l-2 border-orange-200 pl-2">
                                        "{step.quote}"
                                    </div>
                                </div>
                            )) || (
                                    // Fallback if no data
                                    <>
                                        {/* Fallback code same as before */}
                                    </>
                                )}
                        </div>
                    </div>
                )}

                {activeTab === 'interests' && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Logic to prepare interests data */}
                        {(() => {
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
                                    <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                                        No interests to display.
                                    </div>
                                );
                            }

                            // Safety check for active index
                            const currentInterest = interests[activeInterest] || interests[0];

                            return (
                                <>
                                    <h2 className="text-xl font-bold text-black mb-6">Interests & Soft Skills</h2>
                                    <div className="flex-1 flex gap-8 min-h-0">
                                        {/* List */}
                                        <div className="w-1/3 border-r border-gray-100 pr-4 overflow-y-auto about-scrollbar">
                                            <div className="space-y-1">
                                                {interests.map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveInterest(idx)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeInterest === idx
                                                            ? "bg-black text-white font-medium shadow-md scale-105 origin-left"
                                                            : "text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        {item.text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="flex-1 pt-2 overflow-y-auto about-scrollbar">
                                            <h3 className="text-lg font-semibold text-black mb-2">
                                                {currentInterest?.text}
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                {currentInterest?.description}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {activeTab === 'archive' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-black mb-2">Archive</h1>
                            <p className="text-gray-600 text-sm">
                                Experimental works, visual art, and personal explorations.
                                These projects showcase style range outside of commercial constraints.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {archiveProjects.map((project) => (
                                <div key={project.id} className="group relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    {project.type === 'visual_art' && (
                                        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                            Art
                                        </div>
                                    )}
                                    {/* Handle Image/Video */}
                                    {project.cover.endsWith('.mp4') ? (
                                        <video
                                            src={project.cover}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={project.cover}
                                            alt={project.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent pt-8">
                                        <h3 className="text-white text-sm font-bold truncate">{project.title}</h3>
                                        <p className="text-white/70 text-xs truncate">{project.tags.join(', ')}</p>
                                    </div>
                                </div>
                            ))}
                            {archiveProjects.length === 0 && (
                                <p className="text-gray-400 italic col-span-2 text-center py-8">No archived projects found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
