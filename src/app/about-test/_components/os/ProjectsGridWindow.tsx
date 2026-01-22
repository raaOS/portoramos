import React from 'react';
import type { Project } from '@/types/projects';
import MasonryGrid from '@/components/layout/MasonryGrid';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';

interface ProjectsGridWindowProps {
    projects: Project[];
    onOpenProject: (project: Project) => void;
}

export default function ProjectsGridWindow({ projects, onOpenProject }: ProjectsGridWindowProps) {
    return (
        <div className="w-full h-full bg-[#f5f5f7] overflow-y-auto p-8 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 text-black pl-4">Launchpad</h2>
            <MasonryGrid columns="default">
                {projects.map((project) => (
                    <ProjectCardPinterest
                        key={project.id}
                        project={project}
                        onClick={() => onOpenProject(project)}
                        interactive={true}
                    />
                ))}
            </MasonryGrid>
            <div className="pb-20" />
        </div>
    );
}
