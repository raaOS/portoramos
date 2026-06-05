import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User, FileText, Lightbulb, Brain, type LucideIcon } from 'lucide-react';
import type { AboutData } from '@/types/about';
import type { ExperienceData } from '@/types/experience';
import type { HardSkillsData } from '@/types/hardSkill';
import '../styles/os-scrollbar.css';
import '../styles/about-responsive.css';

// Sub-components (Clean Code: Sections extracted)
import { AboutTab } from '../sections/AboutTab';
import { CVTab } from '../sections/CVTab';
import { PhilosophyTab } from '../sections/PhilosophyTab';
import { InterestsTab } from '../sections/InterestsTab';

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

const AUTO_COLLAPSE_BREAKPOINT = 700;

const MenuButton = ({
  id,
  label,
  icon: Icon,
  activeTab,
  setActiveTab,
  collapsed,
}: MenuButtonProps & { collapsed?: boolean }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex w-full items-center justify-between overflow-hidden rounded-md py-2 text-sm transition-colors ${
      activeTab === id ? 'bg-black/10 font-semibold text-black' : 'text-gray-600 hover:bg-black/5'
    }`}
    title={collapsed ? label : undefined}
  >
    <div className="flex min-w-0 shrink-0 items-center gap-0">
      <div className="flex w-[48px] shrink-0 justify-center">
        <Icon size={16} />
      </div>
      <span
        className={`about-sidebar-text overflow-hidden whitespace-normal text-left leading-tight transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'ml-1 w-auto opacity-100'}`}
      >
        {label}
      </span>
    </div>
  </button>
);

export default function AboutContent({
  aboutData,
  experienceData,
  hardSkillsData,
}: AboutContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCompactLayoutRef = useRef<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'cv' | 'philosophy' | 'interests'>('about');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncLayout = (width: number) => {
      const isCompact = width <= AUTO_COLLAPSE_BREAKPOINT;

      if (isCompact && lastCompactLayoutRef.current !== true) {
        setSidebarCollapsed(true);
      }

      lastCompactLayoutRef.current = isCompact;
    };

    syncLayout(container.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncLayout(entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="about-container flex h-full w-full min-w-0 bg-[#ECECEC] font-sans"
    >
      {/* Sidebar (Left) */}
      <div
        onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
        data-no-window-drag
        aria-label={sidebarCollapsed ? 'Open About sidebar' : 'About sidebar'}
        className={`about-sidebar ${sidebarCollapsed ? 'collapsed cursor-pointer hover:bg-black/5' : 'expanded'} relative z-20 flex shrink-0 flex-col gap-1 overflow-hidden border-r border-[#D1D1D1] bg-[#E3E3E3]/50 p-3 pt-4 transition-[width] duration-300 ease-in-out`}
      >
        <div
          className={`about-sidebar-header mb-1 overflow-hidden whitespace-nowrap px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
        >
          Personal
        </div>
        <MenuButton
          id="about"
          label="About me"
          icon={User}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
        />
        <MenuButton
          id="cv"
          label="CV"
          icon={FileText}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
        />
        <MenuButton
          id="philosophy"
          label="Design Thinking"
          icon={Lightbulb}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
        />
        <MenuButton
          id="interests"
          label="Skillset"
          icon={Brain}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
        />

        <div className="mt-auto overflow-hidden pt-4">
          <Link
            href="/cv?mode=ats&print=true"
            target="_blank"
            className="flex w-full items-center justify-center gap-2 overflow-hidden rounded-md py-2.5 text-sm text-gray-600 transition-colors hover:bg-red-600 hover:text-white active:bg-red-700 active:text-white"
            title={sidebarCollapsed ? 'Download CV' : undefined}
          >
            <div className="flex shrink-0 items-center justify-center">
              <FileText size={16} />
            </div>
            <span
              className={`about-sidebar-download-text overflow-hidden whitespace-nowrap leading-tight transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'ml-1 w-auto opacity-100'}`}
            >
              Download CV
            </span>
          </Link>
        </div>
      </div>

      {/* Content Area (Right) */}
      <div
        onClick={() => !sidebarCollapsed && setSidebarCollapsed(true)}
        className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white ${!sidebarCollapsed ? 'cursor-pointer' : ''}`}
      >
        <div
          data-lenis-prevent
          className="about-content-area os-scrollbar min-w-0 flex-1 overflow-y-auto overscroll-contain p-8 pb-12"
          style={{ touchAction: 'pan-y' }}
        >
          {activeTab === 'about' && <AboutTab aboutData={aboutData} />}
          {activeTab === 'cv' && <CVTab experienceData={experienceData} />}
          {activeTab === 'philosophy' && <PhilosophyTab aboutData={aboutData} />}
          {activeTab === 'interests' && (
            <InterestsTab aboutData={aboutData} hardSkillsData={hardSkillsData} />
          )}
        </div>
      </div>
    </div>
  );
}
