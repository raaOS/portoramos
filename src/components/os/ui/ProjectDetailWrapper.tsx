import React from 'react';
import dynamic from 'next/dynamic';
import type { Project } from '@/types/projects';

const ProjectPdfViewer = dynamic(
  () => import('@/components/projects/ProjectPdfViewer'),
  {
    loading: () => (
      <div className="h-full w-full animate-pulse bg-neutral-100 dark:bg-neutral-900" />
    ),
    ssr: false,
  }
);

interface ProjectDetailWrapperProps {
  project: Project;
  projects?: Project[];
}

const ProjectDetailWrapper = ({ project }: ProjectDetailWrapperProps) => {
  return <ProjectPdfViewer project={project} isWindowMode={true} />;
};

export default ProjectDetailWrapper;
