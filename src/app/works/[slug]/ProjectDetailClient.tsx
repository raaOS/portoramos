'use client';

import React from 'react';
import { Project } from '@/types/projects';
import ProjectDetailTwoColumn from './ProjectDetailTwoColumn';

interface Props {
    project: Project;
}

export default function ProjectDetailClient({ project }: Props) {
    return (
        <ProjectDetailTwoColumn project={project} />
    );
}
