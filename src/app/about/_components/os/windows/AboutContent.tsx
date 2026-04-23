import React, { useState } from "react";
import Link from "next/link";
import { User, FileText, Lightbulb, Brain, type LucideIcon } from "lucide-react";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import "../styles/os-scrollbar.css";

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
    icon: LucideIcon;
    activeTab: 'about' | 'cv' | 'philosophy' | 'interests';
    setActiveTab: (id: 'about' | 'cv' | 'philosophy' | 'interests') => void;
}

const MenuButton = ({ id, label, icon: Icon, activeTab, setActiveTab, collapsed }: MenuButtonProps & { collapsed?: boolean }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between py-2 rounded-md text-sm transition-colors overflow-hidden ${activeTab === id
            ? "bg-black/10 text-black font-semibold"
            : "text-gray-600 hover:bg-black/5"
            }`}
        title={collapsed ? label : undefined}
    >
        <div className="flex items-center gap-0 shrink-0 min-w-0">
            <div className="w-[48px] flex justify-center shrink-0">
                <Icon size={16} />
            </div>
            <span className={`transition-all duration-300 overflow-hidden whitespace-normal leading-tight text-left ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
                {label}
            </span>
        </div>
    </button>
);

export default function AboutContent({ aboutData, experienceData, hardSkillsData }: AboutContentProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'cv' | 'philosophy' | 'interests'>('about');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-full w-full bg-[#ECECEC] font-sans">

            {/* Sidebar (Left) */}
            <div
                onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
                className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[72px] md:w-[200px]'} shrink-0 bg-[#E3E3E3]/50 border-r border-[#D1D1D1] p-3 flex flex-col gap-1 pt-4 transition-[width] duration-300 ease-in-out overflow-hidden z-20 relative ${sidebarCollapsed ? 'cursor-pointer hover:bg-black/5' : ''}`}
            >
                <div className={`text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 mb-1 transition-all duration-300 whitespace-nowrap overflow-hidden ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                    Personal
                </div>
                <MenuButton id="about" label="About me" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
                <MenuButton id="cv" label="CV" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
                <MenuButton id="philosophy" label="Design Thinking" icon={Lightbulb} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />
                <MenuButton id="interests" label="Skillset" icon={Brain} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={sidebarCollapsed} />

                <div className="mt-auto pt-4 overflow-hidden">
                    <Link
                        href="/cv?mode=ats&print=true"
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm transition-colors text-gray-600 hover:bg-red-600 hover:text-white active:bg-red-700 active:text-white overflow-hidden"
                        title={sidebarCollapsed ? 'Download CV' : undefined}
                    >
                        <div className="flex items-center justify-center shrink-0">
                            <FileText size={16} />
                        </div>
                        <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap leading-tight ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
                            Download CV
                        </span>
                    </Link>
                </div>
            </div>

            {/* Content Area (Right) */}
            <div
                onClick={() => !sidebarCollapsed && setSidebarCollapsed(true)}
                data-lenis-prevent
                className={`flex-1 bg-white h-full overflow-y-auto overscroll-contain p-8 pb-20 os-scrollbar min-h-0 ${!sidebarCollapsed ? 'cursor-pointer' : ''}`}
                style={{ touchAction: "pan-y" }}
            >
                {activeTab === 'about' && <AboutTab aboutData={aboutData} />}
                {activeTab === 'cv' && <CVTab experienceData={experienceData} />}
                {activeTab === 'philosophy' && <PhilosophyTab aboutData={aboutData} />}
                {activeTab === 'interests' && <InterestsTab aboutData={aboutData} hardSkillsData={hardSkillsData} />}
            </div>
        </div>
    );
}
