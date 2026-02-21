import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Check, User, FileText, Heart, Lightbulb, Archive, ExternalLink } from "lucide-react";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project } from "@/types/projects";
import { getProxiedUrl } from "@/lib/utils";

interface AboutContentProps {
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects?: Project[];
}

interface MenuButtonProps {
    id: 'about' | 'cv' | 'philosophy' | 'interests' | 'archive';
    label: string;
    count?: string;
    icon: any;
    activeTab: string;
    setActiveTab: (id: any) => void;
}

const MenuButton = ({ id, label, count, icon: Icon, activeTab, setActiveTab }: MenuButtonProps) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between py-2 rounded-md text-sm transition-colors whitespace-nowrap overflow-hidden ${activeTab === id
            ? "bg-black/10 text-black font-semibold"
            : "text-gray-600 hover:bg-black/5"
            }`}
        title={label}
    >
        <div className="flex items-center gap-0 shrink-0">
            <div className="w-[48px] flex justify-center shrink-0">
                <Icon size={16} />
            </div>
            <span className="opacity-0 md:opacity-100 transition-opacity duration-300 ml-1">{label}</span>
        </div>
        {count && <span className="text-gray-400 text-xs opacity-0 md:opacity-100 transition-opacity duration-300 ml-2 mr-3">{count}</span>}
    </button>
);

export default function AboutContent({ aboutData, experienceData, hardSkillsData, projects = [] }: AboutContentProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'cv' | 'philosophy' | 'interests' | 'archive'>('about');

    const archiveProjects = projects.filter(p => p.type === 'visual_art');

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
            <div className="w-[72px] md:w-[200px] shrink-0 bg-[#E3E3E3]/50 border-r border-[#D1D1D1] p-3 flex flex-col gap-1 pt-4 transition-[width] duration-300 ease-in-out overflow-hidden z-20 relative">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-1 opacity-0 md:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Personal
                </div>
                <MenuButton id="about" label="About me" count="18" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} />
                <MenuButton id="cv" label="CV" count={experienceData?.workExperience.length ? String(experienceData.workExperience.length) : "0"} icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} />
                <MenuButton id="philosophy" label="Philosophy" count="3" icon={Lightbulb} activeTab={activeTab} setActiveTab={setActiveTab} />
                <MenuButton id="interests" label="Interests" count={(aboutData?.softSkills?.items?.length || aboutData?.softSkills?.texts?.length) ? "∞" : "0"} icon={Heart} activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="h-px bg-gray-300 my-2 mx-1 opacity-0 md:opacity-50 transition-opacity duration-300"></div>

                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-1 opacity-0 md:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Works
                </div>
                <MenuButton id="archive" label="Archive" count={String(archiveProjects.length)} icon={Archive} activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="mt-auto pt-4 overflow-hidden">
                    <Link
                        href="/cv?mode=ats&print=true"
                        target="_blank"
                        className="w-full flex items-center gap-0 py-2 rounded-md text-sm transition-colors text-gray-600 hover:bg-red-600 hover:text-white active:bg-red-700 active:text-white whitespace-nowrap"
                        title="Download CV"
                    >
                        {/* Fixed width container matching MenuButton for alignment */}
                        <div className="w-[48px] flex justify-center shrink-0">
                            <FileText size={16} />
                        </div>
                        <span className="opacity-0 md:opacity-100 transition-opacity duration-300 ml-1">Download CV</span>
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



                            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                                {aboutData?.professional.bio.content || "Loading..."}
                            </p>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-black mb-4">I can do...</h2>
                            <div className="space-y-6">
                                {hardSkillsData?.skills?.filter(s => s.isActive !== false).map((skill, idx) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                        {/* Skill Name */}
                                        <div className="flex items-center gap-2">

                                            {skill.iconUrl && (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={getProxiedUrl(skill.iconUrl)}
                                                    alt={skill.name}
                                                    className="w-5 h-5 object-contain"
                                                />
                                            )}
                                            <h3 className="font-bold text-gray-900 text-sm">{skill.name}</h3>
                                        </div>

                                        {/* Description Points */}
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
                                        &quot;{step.quote}&quot;
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h1 className="text-2xl font-bold text-black mb-6">Interests & Soft Skills</h1>

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
                                    <div className="text-gray-400 text-sm italic">
                                        No interests to display.
                                    </div>
                                );
                            }

                            return (
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
                                            src={getProxiedUrl(project.cover)}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="none"
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={getProxiedUrl(project.cover)}
                                            alt={project.title}
                                            loading="lazy"
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
