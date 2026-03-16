'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// Note: columnBProjects is computed but not currently used (reserved for future two-column layout)
import { motion } from 'framer-motion';
import type { Project } from '@/types/projects';
import MasonryGrid from '@/components/layout/MasonryGrid';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';

const INITIAL_COUNT = 5;
const BATCH_SIZE = 24;

// Static animation configs to prevent object recreation
const ANIMATION_CONFIG = {
    initial: { y: 30 },
    whileInView: { y: 0 },
    viewport: { once: true, margin: '100px' },
    transition: { duration: 0.4, ease: 'easeOut' as const }
};

interface UseInfiniteProjectsReturn {
    displayedProjects: Project[];
    isLoading: boolean;
    observerTarget: React.RefObject<HTMLDivElement>;
}

export function useInfiniteProjects(projects: Project[]): UseInfiniteProjectsReturn {
    const [hasMounted, setHasMounted] = useState(false);
    const [displayedProjects, setDisplayedProjects] = useState<Project[]>(() => {
        return projects.slice(0, INITIAL_COUNT);
    });
    const [isLoading, setIsLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null!);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const loadMore = useCallback(() => {
        if (!hasMounted || isLoading || projects.length === 0) return;
        
        setIsLoading(true);
        const currentCount = displayedProjects.length;
        const nextBatch: Project[] = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            nextBatch.push(projects[(currentCount + i) % projects.length]);
        }
        setDisplayedProjects(prev => [...prev, ...nextBatch]);
        setTimeout(() => {
            setIsLoading(false);
        }, 50);
    }, [displayedProjects.length, hasMounted, isLoading, projects]);

    useEffect(() => {
        if (!hasMounted) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            {
                rootMargin: '800px 0px',
                threshold: 0.1
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMounted, loadMore]);

    return { displayedProjects, isLoading, observerTarget };
}
interface ProjectRelatedProps {
    projects: Project[];
}

export function ProjectRelated({ projects }: ProjectRelatedProps) {
    const { displayedProjects, isLoading, observerTarget } = useInfiniteProjects(projects);

    // FIX (Point 2): Use Even/Odd logic
    const { columnAProjects, columnBProjects } = useMemo(() => {
        return {
            columnAProjects: displayedProjects.filter((_, idx) => idx % 2 !== 0),
            columnBProjects: displayedProjects.filter((_, idx) => idx % 2 === 0)
        };
    }, [displayedProjects]);

    return (
        <>
            <MasonryGrid columns="sidebar">
                {columnAProjects.map((p: Project, index: number) => (
                    <ProjectRelatedItem 
                        key={`col-a-${p.slug}-${index}`} 
                        project={p} 
                        index={index} 
                    />
                ))}
            </MasonryGrid>

            <div ref={observerTarget} className="h-10 w-full pointer-events-none" aria-hidden="true" />
            {isLoading && (
                <div className="text-center py-6 sm:py-8 opacity-50">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-400"></div>
                    <p className="text-xs mt-2 text-gray-500">Memuat lebih banyak project...</p>
                </div>
            )}
        </>
    );
}

// Memoized item component to prevent unnecessary re-renders
function ProjectRelatedItem({ project, index }: { project: Project; index: number }) {
    const isPriority = index < 2;
    
    if (isPriority) {
        return (
            <div>
                <ProjectCardPinterest project={project} priority={true} />
            </div>
        );
    }
    
    return (
        <motion.div {...ANIMATION_CONFIG}>
            <ProjectCardPinterest project={project} priority={false} />
        </motion.div>
    );
}

interface ProjectRelatedColumnProps {
    projects: Project[];
    column: 'A' | 'B';
}

export function ProjectRelatedColumn({ projects, column }: ProjectRelatedColumnProps) {
    return (
        <div className={column === 'B' ? 'lg:w-1/2' : ''}>
            <MasonryGrid columns="sidebar">
                {projects.map((p: Project, index: number) => (
                    <ProjectRelatedColumnItem
                        key={`col-${column}-${p.slug}-${index}`}
                        project={p}
                        index={index}
                    />
                ))}
            </MasonryGrid>
        </div>
    );
}

// Memoized column item
function ProjectRelatedColumnItem({ project, index }: { project: Project; index: number }) {
    const isPriority = index < 2;
    
    if (isPriority) {
        return (
            <div>
                <ProjectCardPinterest project={project} priority={true} />
            </div>
        );
    }
    
    return (
        <motion.div {...ANIMATION_CONFIG}>
            <ProjectCardPinterest project={project} priority={false} />
        </motion.div>
    );
}
