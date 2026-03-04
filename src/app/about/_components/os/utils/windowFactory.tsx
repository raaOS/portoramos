import React from 'react';
import dynamic from 'next/dynamic';
import { Trash2 } from "lucide-react";
import { WindowState } from "@/hooks/useWindowManager";
import { AboutData } from "@/types/about";
import { ExperienceData } from "@/types/experience";
import { HardSkillsData } from "@/types/hardSkill";
import { Project } from "@/types/projects";
import { ContactProfile } from "../data/mockChats";

const AboutContent = dynamic(() => import("../windows/AboutContent"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

const ChatWindow = dynamic(() => import("../windows/ChatWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

const ProjectDetailWrapper = dynamic(() => import("../ui/ProjectDetailWrapper"), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-full w-full rounded" />,
    ssr: false
});

const IndexClientWithAutoUpdate = dynamic(() => import("@/components/home/IndexClientWithAutoUpdate"), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-full w-full rounded" />,
    ssr: false
});

interface WindowFactoryProps {
    aboutData: AboutData | null | undefined;
    experienceData: ExperienceData | null | undefined;
    hardSkillsData: HardSkillsData | null | undefined;
    projects: Project[];
    commercialProjects: Project[];
    dynamicContacts: Record<string, ContactProfile>;
}

export const createInitialWindows = ({
    aboutData,
    experienceData,
    hardSkillsData,
    projects,
    commercialProjects,
    dynamicContacts
}: WindowFactoryProps): WindowState[] => [
        {
            id: "about",
            title: "Finder: About Me",
            isOpen: true,
            zIndex: 10,
            noPadding: true,
            initialPosition: {
                x: aboutData?.windowPreferences?.about?.x ?? 100,
                y: aboutData?.windowPreferences?.about?.y ?? 80
            },
            width: 900,
            height: 600,
            content: <AboutContent aboutData={aboutData || undefined} experienceData={experienceData || undefined} hardSkillsData={hardSkillsData || undefined} projects={projects} />
        },
        {
            id: "whatsapp",
            title: "WhatsApp",
            isOpen: false,
            zIndex: 11,
            noPadding: true,
            initialPosition: { x: 200, y: 120 },
            width: 450,
            height: 600,
            content: <ChatWindow customContacts={dynamicContacts} />
        },
        {
            id: "trash-bin",
            title: "Recycle Bin",
            isOpen: false,
            zIndex: 1,
            initialPosition: { x: 400, y: 250 },
            width: 400,
            height: 250,
            content: (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Trash2 size={48} className="text-gray-400 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Access Denied</h3>
                    <p className="text-gray-500 text-sm">You cannot delete perfection.</p>
                </div>
            )
        },
        {
            id: "projects",
            title: "Finder: Projects",
            isOpen: false,
            zIndex: 12,
            noPadding: true,
            initialPosition: { x: 50, y: 50 },
            width: 1000,
            height: 700,
            content: null // Content will be injected dynamically via openProjectWindow
        }
    ];
