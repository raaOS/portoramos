'use client';

import { motion } from 'framer-motion';
import type { Project } from '@/types/projects';
import ReadMoreDescription from '@/components/ui/ReadMoreDescription';
import { useMemo, useCallback } from 'react';

// Static animation config
const TAB_CONTENT_ANIMATION = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
};

interface ProjectNarrativeProps {
    project: Project;
    translations: Record<string, string> | null;
    activeTab: 'description' | 'challenge' | 'solution' | 'impact';
    onTabChange: (tab: 'description' | 'challenge' | 'solution' | 'impact') => void;
}

export function ProjectNarrative({ project, translations, activeTab, onTabChange }: ProjectNarrativeProps) {
    // Compute booleans FIRST (before hooks)
    const hasNarrative = !!project.narrative;
    const hasDescription = !!project.description;
    const hasChallenge = !!(project.narrative?.challenge || project.narrative?.concept);
    const hasSolution = !!(project.narrative?.solution || project.narrative?.process);
    const hasImpact = !!(project.narrative?.impact || project.narrative?.result || project.narrative?.detail);

    // Memoize tab configs to prevent object recreation
    // MUST be called before any early return (Rules of Hooks)
    const tabs = useMemo(() => {
        const result: Array<{
            id: 'description' | 'challenge' | 'solution' | 'impact';
            label: string;
            color: 'gray' | 'red' | 'blue' | 'green';
            show: boolean;
        }> = [
            { id: 'description', label: translations ? 'About' : 'Tentang', color: 'gray', show: hasDescription },
            { 
                id: 'challenge', 
                label: translations 
                    ? (project.narrative?.concept ? 'Concept' : 'Challenge') 
                    : (project.narrative?.concept ? 'Konsep' : 'Tantangan'),
                color: 'red',
                show: hasChallenge
            },
            { 
                id: 'solution', 
                label: translations 
                    ? (project.narrative?.process ? 'Process' : 'Solution') 
                    : (project.narrative?.process ? 'Proses' : 'Solusi'),
                color: 'blue',
                show: hasSolution
            },
            { 
                id: 'impact', 
                label: translations 
                    ? (project.narrative?.impact ? 'Impact' : (project.narrative?.detail ? 'Detail' : 'Result')) 
                    : (project.narrative?.impact ? 'Dampak' : (project.narrative?.detail ? 'Detail' : 'Hasil')),
                color: 'green',
                show: hasImpact
            }
        ];
        return result.filter(t => t.show);
    }, [translations, hasNarrative, hasDescription, hasChallenge, hasSolution, hasImpact]);

    // useCallback MUST be called before any early return (Rules of Hooks)
    const getTabClasses = useCallback((tabId: string, color: string) => {
        const isActive = activeTab === tabId;
        const baseClasses = 'pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap px-1';
        
        if (!isActive) {
            return `${baseClasses} text-gray-400 hover:text-gray-700 dark:hover:text-gray-300`;
        }
        
        const colorClasses: Record<string, string> = {
            gray: 'text-gray-900 dark:text-white border-gray-900 dark:border-white',
            red: 'text-red-500 border-red-500',
            blue: 'text-blue-500 border-blue-500',
            green: 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
        };
        
        return `${baseClasses} ${colorClasses[color] || colorClasses.gray} border-b-2`;
    }, [activeTab]);

    // Early return MUST be after all hooks (Rules of Hooks)
    if (!hasNarrative) return null;

    return (
        <div className="mb-8 font-sans border-b border-gray-100 dark:border-gray-800 pb-8">
            {/* Context */}
            {project.narrative!.context && (
                <div className="mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                        {translations ? 'Context' : 'Konteks'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        &quot;{translations?.context || project.narrative!.context}&quot;
                    </p>
                </div>
            )}

            {/* Tabs */}
            {tabs.length > 0 && (
                <div className="mt-8">
                    <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 relative overflow-x-auto no-scrollbar gap-2 sm:gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={getTabClasses(tab.id, tab.color)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <TabContent 
                        activeTab={activeTab}
                        project={project}
                        translations={translations}
                    />
                </div>
            )}
        </div>
    );
}

// Separate component for tab content to prevent re-render of entire narrative
function TabContent({ 
    activeTab, 
    project, 
    translations 
}: { 
    activeTab: string;
    project: Project;
    translations: Record<string, string> | null;
}) {
    const narrative = project.narrative;
    if (!narrative) return null;

    switch (activeTab) {
        case 'description':
            if (!project.description) return null;
            return (
                <motion.div {...TAB_CONTENT_ANIMATION}>
                    <ReadMoreDescription
                        text={translations?.description || project.description}
                        maxLines={10}
                        className="text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200"
                    />
                </motion.div>
            );
        
        case 'challenge':
            if (!narrative.challenge && !narrative.concept) return null;
            return (
                <motion.div {...TAB_CONTENT_ANIMATION}>
                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                        {translations?.challenge || narrative.challenge || narrative.concept}
                    </p>
                </motion.div>
            );
        
        case 'solution':
            if (!narrative.solution && !narrative.process) return null;
            return (
                <motion.div {...TAB_CONTENT_ANIMATION}>
                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                        {translations?.solution || narrative.solution || narrative.process}
                    </p>
                </motion.div>
            );
        
        case 'impact':
            if (!narrative.impact && !narrative.result && !narrative.detail) return null;
            return (
                <motion.div {...TAB_CONTENT_ANIMATION}>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30">
                        <p className={narrative.impact 
                            ? 'text-base sm:text-lg font-medium text-gray-900 dark:text-white leading-relaxed'
                            : 'text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed'
                        }>
                            {translations?.impact || narrative.impact || narrative.result || narrative.detail}
                        </p>
                    </div>
                </motion.div>
            );
        
        default:
            return null;
    }
}
