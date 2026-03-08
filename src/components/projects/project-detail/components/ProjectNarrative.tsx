'use client';

import type { Project } from '@/types/projects';
import ReadMoreDescription from '@/components/ui/ReadMoreDescription';
import { useMemo } from 'react';

interface ProjectNarrativeProps {
    project: Project;
    translations: Record<string, string> | null;
    activeTab: 'description' | 'challenge' | 'solution' | 'impact';
    onTabChange: (tab: 'description' | 'challenge' | 'solution' | 'impact') => void;
}

export function ProjectNarrative({ project, translations, activeTab, onTabChange }: ProjectNarrativeProps) {
    const hasNarrative = !!project.narrative;
    const hasDescription = !!project.description;
    const hasChallenge = !!(project.narrative?.challenge || project.narrative?.concept);
    const hasSolution = !!(project.narrative?.solution || project.narrative?.process);
    const hasImpact = !!(project.narrative?.impact || project.narrative?.result || project.narrative?.detail);

    const tabs = useMemo(() => {
        const result: Array<{
            id: 'description' | 'challenge' | 'solution' | 'impact';
            label: string;
            show: boolean;
        }> = [
                { id: 'description', label: translations ? 'About' : 'Tentang', show: hasDescription },
                {
                    id: 'challenge',
                    label: translations
                        ? (project.narrative?.concept ? 'Concept' : 'Challenge')
                        : (project.narrative?.concept ? 'Konsep' : 'Tantangan'),
                    show: hasChallenge
                },
                {
                    id: 'solution',
                    label: translations
                        ? (project.narrative?.process ? 'Process' : 'Solution')
                        : (project.narrative?.process ? 'Proses' : 'Solusi'),
                    show: hasSolution
                },
                {
                    id: 'impact',
                    label: translations
                        ? (project.narrative?.impact ? 'Impact' : (project.narrative?.detail ? 'Detail' : 'Result'))
                        : (project.narrative?.impact ? 'Dampak' : (project.narrative?.detail ? 'Detail' : 'Hasil')),
                    show: hasImpact
                }
            ];
        return result.filter(t => t.show);
    }, [translations, project.narrative, hasDescription, hasChallenge, hasSolution, hasImpact]);

    const tabStyles: Record<string, { bg: string, tint: string, border: string }> = {
        description: {
            bg: 'bg-indigo-600 dark:bg-indigo-500',
            tint: 'bg-indigo-50/30 dark:bg-indigo-950/20',
            border: 'border-indigo-100 dark:border-indigo-500/20'
        },
        challenge: {
            bg: 'bg-rose-600 dark:bg-rose-500',
            tint: 'bg-rose-50/30 dark:bg-rose-950/20',
            border: 'border-rose-100 dark:border-rose-500/20'
        },
        solution: {
            bg: 'bg-blue-600 dark:bg-blue-500',
            tint: 'bg-blue-50/30 dark:bg-blue-950/20',
            border: 'border-blue-100 dark:border-blue-500/20'
        },
        impact: {
            bg: 'bg-emerald-600 dark:bg-emerald-500',
            tint: 'bg-emerald-50/30 dark:bg-emerald-950/20',
            border: 'border-emerald-100 dark:border-emerald-500/20'
        }
    };

    const currentStyle = tabStyles[activeTab];

    if (!hasNarrative && !hasDescription) return null;

    return (
        <div className="mt-12 mb-8 font-sans">
            {/* React-Tabs Style Container */}
            <div className="react-tabs-container">
                {/* Tab List Base Line - Consolidated to prevent flickering */}
                <div className="relative z-10 w-full border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-end px-0">
                        {tabs.map((tab, idx) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`
                                        relative px-5 sm:px-8 py-1.5 text-sm font-bold transition-all duration-150
                                        flex items-center justify-center
                                        outline-none -mb-[1px]
                                        ${isActive
                                            ? `${tabStyles[tab.id].bg} rounded-t-lg rounded-b-none text-white z-20 transition-all duration-150 -mb-px`
                                            : 'bg-transparent border-t border-x border-transparent text-gray-400 hover:text-gray-600 z-0'
                                        }
                                        ${idx === 0 ? 'ml-0' : ''}
                                    `}
                                >
                                    <span className="relative z-10 text-center">
                                        {tab.label}
                                    </span>

                                    {/* Anti-Ghosting Shield: Force-covers the baseline at the point of contact */}
                                    {isActive && (
                                        <div className={`absolute -bottom-px left-0 right-0 h-[4px] ${tabStyles[tab.id].bg} z-30`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Panel / Content Area - Stable Height to prevent jumping */}
                <div className={`
                    border-x border-b border-gray-200 dark:border-gray-700 
                    ${currentStyle.border}
                    rounded-b-lg px-6 py-8 sm:px-10 sm:py-10 min-h-[220px] 
                    ${currentStyle.tint} bg-white dark:bg-gray-950 
                    shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative z-0 w-full overflow-hidden
                `}>
                    <div className="relative z-10">
                        <TabContent
                            activeTab={activeTab}
                            project={project}
                            translations={translations}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabContent({ activeTab, project, translations }: {
    activeTab: string;
    project: Project;
    translations: Record<string, string> | null;
}) {
    const narrative = project.narrative;

    switch (activeTab) {
        case 'description':
            return (
                <div className="space-y-4">
                    <ReadMoreDescription
                        text={translations?.description || project.description || ''}
                        maxLines={12}
                        className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300"
                    />
                </div>
            );

        case 'challenge':
            return (
                <div className="space-y-4">
                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                        {translations?.challenge || narrative?.challenge || narrative?.concept}
                    </p>
                </div>
            );

        case 'solution':
            return (
                <div className="space-y-4">
                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                        {translations?.solution || narrative?.solution || narrative?.process}
                    </p>
                </div>
            );

        case 'impact':
            return (
                <div className="space-y-4">
                    <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                        {translations?.impact || narrative?.impact || narrative?.result || narrative?.detail}
                    </p>
                </div>
            );

        default:
            return null;
    }
}
