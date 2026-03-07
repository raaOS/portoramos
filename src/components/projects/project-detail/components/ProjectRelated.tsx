'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// Note: columnBProjects is computed but not currently used (reserved for future two-column layout)
import { motion } from 'framer-motion';
import type { Project } from '@/types/projects';
import MasonryGrid from '@/components/layout/MasonryGrid';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';

const INITIAL_COUNT = 6;
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

function useInfiniteProjects(projects: Project[]): UseInfiniteProjectsReturn {
    const [displayedProjects, setDisplayedProjects] = useState<Project[]>(() => {
        return projects.slice(0, INITIAL_COUNT);
    });
    const [isLoading, setIsLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null!);

    const loadMore = useCallback(() => {
        if (isLoading || projects.length === 0) return;
        
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
    }, [displayedProjects.length, isLoading, projects]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            {
                rootMargin: '1500px 0px',
                threshold: 0.1
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    return { displayedProjects, isLoading, observerTarget };
}

interface ProjectRelatedProps {
    projects: Project[];
}

export function ProjectRelated({ projects }: ProjectRelatedProps) {
    const { displayedProjects, isLoading, observerTarget } = useInfiniteProjects(projects);

    const { columnAProjects } = useMemo(() => {
        const halfIndex = Math.ceil(displayedProjects.length / 2);
        return {
            columnAProjects: displayedProjects.slice(0, halfIndex),
            columnBProjects: displayedProjects.slice(halfIndex)
        };
    }, [displayedProjects]);

    return (
        <>
            <MasonryGrid columns="sidebar">
                {columnAProjects.map((p: Project, index: number) => (
                    <ProjectRelatedItem 
                        key={`col-a-${p.slug}`} 
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
            <div style={{ willChange: 'transform' }}>
                <ProjectCardPinterest project={project} priority={true} />
            </div>
        );
    }
    
    return (
        <motion.div
            {...ANIMATION_CONFIG}
            style={{ willChange: 'transform' }}
        >
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
                        key={`col-${column}-${p.slug}`}
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
            <div style={{ willChange: 'transform' }}>
                <ProjectCardPinterest project={project} priority={true} />
            </div>
        );
    }
    
    return (
        <motion.div
            {...ANIMATION_CONFIG}
            style={{ willChange: 'transform' }}
        >
            <ProjectCardPinterest project={project} priority={false} />
        </motion.div>
    );
}
