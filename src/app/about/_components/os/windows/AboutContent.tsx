import React, { useState } from "react";
import Link from "next/link";
import { User, FileText, Heart, Lightbulb, type LucideIcon } from "lucide-react";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";

// Sub-components (Clean Code: Sections extracted)
import { AboutTab } from "../sections/AboutTab";
import { CVTab } from "../sections/CVTab";
import { PhilosophyTab } from "../sections/PhilosophyTab";
import { InterestsTab } from "../sections/InterestsTab";

interface AboutContentProps {
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
}

interface MenuButtonProps {
    id: 'about' | 'cv' | 'philosophy' | 'interests';
    label: string;
    count?: string;
    icon: LucideIcon;
    activeTab: 'about' | 'cv' | 'philosophy' | 'interests';
    setActiveTab: (id: 'about' | 'cv' | 'philosophy' | 'interests') => void;
}

const MenuButton = ({ id, label, count, icon: Icon, activeTab, setActiveTab, collapsed }: MenuButtonProps & { collapsed?: boolean }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between py-2 rounded-md text-sm transition-colors whitespace-nowrap overflow-hidden ${activeTab === id
            ? "bg-black/10 text-black font-semibold"
            : "text-gray-600 hover:bg-black/5"
            }`}
        title={collapsed ? label : undefined}
    >
        <div className="flex items-center gap-0 shrink-0">
            <div className="w-[48px] flex justify-center shrink-0">
                <Icon size={16} />
            </div>
            <span className={`transition-opacity duration-300 ml-1 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
        </div>
        {count && <span className={`text-gray-400 text-xs transition-opacity duration-300 ml-2 mr-3 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{count}</span>}
    </button>
);

export default function AboutContent({ aboutData, experienceData, hardSkillsData }: AboutContentProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'cv' | 'philosophy' | 'interests'>('about');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
            <div
                onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
                className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[72px] md:w-[200px]'} shrink-0 bg-[#E3E3E3]/50 border-r border-[#D1D1D1] p-3 flex flex-col gap-1 pt-4 transition-[width] duration-300 ease-in-out overflow-hidden z-20 relative cursor-pointer`}
            >
                <div className={`text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-1 transition-opacity duration-300 whitespace-nowrap ${sidebarCollapsed ? 'opacity-0' : 'opacity-100 md:opacity-100'}`}>
                    Personal
                </div>
                <MenuButton id="about" label="About me" count="18" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
                <MenuButton id="cv" label="CV" count={experienceData?.workExperience.length ? String(experienceData.workExperience.length) : "0"} icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
                <MenuButton id="philosophy" label="Philosophy" count="3" icon={Lightbulb} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
                <MenuButton id="interests" label="Interests" count={(aboutData?.softSkills?.items?.length || aboutData?.softSkills?.texts?.length) ? "∞" : "0"} icon={Heart} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />

                <div className="mt-auto pt-4 overflow-hidden">
                    <Link
                        href="/cv?mode=ats&print=true"
                        target="_blank"
                        className={`w-full flex items-center gap-0 py-2 rounded-md text-sm transition-colors text-gray-600 hover:bg-red-600 hover:text-white active:bg-red-700 active:text-white whitespace-nowrap ${sidebarCollapsed ? '' : ''}`}
                        title={sidebarCollapsed ? 'Download CV' : undefined}
                    >
                        <div className="w-[48px] flex justify-center shrink-0">
                            <FileText size={16} />
                        </div>
                        <span className={`transition-opacity duration-300 ml-1 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Download CV</span>
                    </Link>
                </div>
            </div>

            {/* Content Area (Right) */}
            <div
                onClick={() => !sidebarCollapsed && setSidebarCollapsed(true)}
                data-lenis-prevent
                className="flex-1 bg-white h-full overflow-y-auto overscroll-contain p-8 pb-20 about-scrollbar min-h-0 cursor-pointer"
                style={{ touchAction: "pan-y" }}
            >
                {activeTab === 'about' && <AboutTab aboutData={aboutData} hardSkillsData={hardSkillsData} />}
                {activeTab === 'cv' && <CVTab experienceData={experienceData} />}
                {activeTab === 'philosophy' && <PhilosophyTab aboutData={aboutData} />}
                {activeTab === 'interests' && <InterestsTab aboutData={aboutData} />}
            </div>
        </div>
    );
}
