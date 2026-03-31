'use client';
  
import { useMemo, useCallback, useSyncExternalStore } from 'react';
import type { Project, GalleryItem } from '@/types/projects';
import { motion } from 'framer-motion';
import LightboxGallery from '@/components/ui/LightboxGallery';
import { useProjectDetail } from './project-detail/hooks';
import {
    ProjectBackButton,
    ProjectCover,
    ProjectHeader,
    ProjectMeta,
    ProjectNarrative,
    ProjectGallery,
    ProjectInteractionBar,
    ProjectRelatedColumn,
    ProjectComments,
    useInfiniteProjects
} from './project-detail/components';

interface ProjectDetailTwoColumnProps {
    project: Project;
    cover: GalleryItem;
    gallery: GalleryItem[];
    ratio: number;
    otherProjects: Project[];
    isWindowMode?: boolean;
}

export default function ProjectDetailTwoColumn({
    project,
    cover,
    gallery,
    ratio,
    otherProjects,
    isWindowMode = false
}: ProjectDetailTwoColumnProps) {
    // SSR-safe mount detection without triggering set-state-in-effect lint
    const subscribe = useCallback(() => () => {}, []);
    const hasMounted = useSyncExternalStore(subscribe, () => true, () => false);

    const {
        comments,
        setComments,
        isProjectLiked,
        metrics,
        translations,
        translateLoading,
        activeGalleryGroup,
        setActiveGalleryGroup,
        activeNarrativeTab,
        setActiveNarrativeTab,
        handleProjectLike,
        handleProjectShare,
        translateAll
    } = useProjectDetail({ project });

    const handleScrollToComments = useCallback(() => {
        setTimeout(() => {
            document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // Memoize container class to prevent recreation
    const containerClassName = useMemo(() => {
        return isWindowMode
            ? 'h-full overflow-y-auto p-3 sm:p-4 lg:p-6'
            : 'min-h-screen pt-10 sm:pt-12 px-3 sm:px-4 lg:px-6 pb-8';
    }, [isWindowMode]);

    // Infinity Scroll Logic
    const { displayedProjects, isLoading, observerTarget } = useInfiniteProjects(otherProjects);

    // Memoize column projects to prevent array recreation
    // FIX (Point 2): Use Even/Odd distribution instead of slice to prevent layout jumps
    const columnAProjects = useMemo(() => {
        if (isWindowMode) return [];
        return displayedProjects.filter((_, idx) => idx % 2 !== 0);
    }, [displayedProjects, isWindowMode]);

    const columnBProjects = useMemo(() => {
        if (isWindowMode) return [];
        return displayedProjects.filter((_, idx) => idx % 2 === 0);
    }, [displayedProjects, isWindowMode]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${containerClassName} bg-white dark:bg-black transition-colors duration-300`}
        >
            {/* Back Button */}
            {!isWindowMode && <ProjectBackButton />}

            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* Left Column */}
                <div className={isWindowMode ? 'w-full' : 'lg:w-1/2 space-y-3 sm:space-y-4'}>
                    <div className="bg-white dark:bg-black rounded-lg sm:rounded-xl shadow-none border border-black/10 dark:border-white/10 transition-all duration-300 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row h-full">
                            {/* Cover & Interaction Section */}
                            <div className="w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-900/20">
                                <ProjectCover project={project} cover={cover} ratio={ratio} />

                                <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8 px-6 lg:px-10 pb-10">
                                    {/* Interaction Bar */}
                                    <ProjectInteractionBar
                                        isProjectLiked={isProjectLiked}
                                        metrics={metrics}
                                        comments={comments}
                                        translations={translations}
                                        translateLoading={translateLoading}
                                        onLike={handleProjectLike}
                                        onShare={handleProjectShare}
                                        onTranslate={translateAll}
                                        onScrollToComments={handleScrollToComments}
                                        client={project.client}
                                        year={project.year}
                                    />

                                    {/* Comments Section */}
                                    <ProjectComments
                                        slug={project.slug}
                                        comments={comments}
                                        setComments={setComments}
                                        allowComments={project.allowComments}
                                    />
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="w-full lg:w-[55%] flex flex-col">
                                <div className="p-4 sm:p-6 lg:p-8">
                                    {/* Header */}
                                    <ProjectHeader
                                        project={project}
                                        translations={translations}
                                        isWindowMode={isWindowMode}
                                    />

                                    {/* Meta Info */}
                                    <ProjectMeta
                                        project={project}
                                        translations={translations}
                                        isWindowMode={isWindowMode}
                                    />

                                    {/* Narrative Tabs */}
                                    <ProjectNarrative
                                        project={project}
                                        translations={translations}
                                        activeTab={activeNarrativeTab}
                                        onTabChange={setActiveNarrativeTab}
                                    />

                                    {/* Gallery */}
                                    <ProjectGallery
                                        project={project}
                                        gallery={gallery}
                                        onGroupClick={setActiveGalleryGroup}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Projects - Column A (Only for non-window mode) */}
                    {!isWindowMode && hasMounted && columnAProjects.length > 0 && (
                        <ProjectRelatedColumn
                            projects={columnAProjects}
                            column="A"
                            // FIX (Point 3): Pass a base index offset if needed, 
                            // but ProjectRelatedColumn internally handles keys.
                            // We will update ProjectRelatedColumn next.
                        />
                    )}
                </div>

                {/* Right Column - Related Projects */}
                {!isWindowMode && hasMounted && columnBProjects.length > 0 && (
                    <ProjectRelatedColumn
                        projects={columnBProjects}
                        column="B"
                    />
                )}
            </div>

            {/* Infinity Scroll Target & Loading UI */}
            {!isWindowMode && (
                <div className="mt-10 pb-20">
                    <div ref={observerTarget} className="h-20 w-full pointer-events-none" aria-hidden="true" />
                    
                    {isLoading && (
                        <div className="text-center opacity-50">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                            <p className="text-xs mt-3 text-gray-500 font-medium whitespace-nowrap">Memuat karya...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {activeGalleryGroup && (
                <LightboxGallery
                    items={activeGalleryGroup.items}
                    groupName={activeGalleryGroup.name}
                    onClose={() => setActiveGalleryGroup(null)}
                />
            )}
        </motion.div>
    );
}

// Re-export hooks and components for external use
export { useProjectDetail } from './project-detail/hooks';
export * from './project-detail/components';
