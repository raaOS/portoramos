import React from 'react';
import dynamic from 'next/dynamic';
import type { Project, GalleryItem } from "@/types/projects";

// Dynamic import to match original behavior
const ProjectDetailTwoColumn = dynamic(() => import("@/components/projects/ProjectDetailTwoColumn"), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-full w-full rounded" />,
    ssr: false
});

const isVideo = (url?: string) => url && /\.(mp4|webm|mov)$/i.test(url);

const ProjectDetailWrapper = ({ project, projects }: { project: Project, projects: Project[] }) => {
    const coverSrc = project.cover || '/placeholder.jpg';
    const cover: GalleryItem = {
        kind: isVideo(coverSrc) ? 'video' : 'image',
        src: coverSrc,
        alt: project.title
    };

    let gallery: GalleryItem[] = [];
    if (project.galleryItems && project.galleryItems.length > 0) {
        gallery = project.galleryItems;
    } else if (project.gallery && project.gallery.length > 0) {
        gallery = project.gallery.map(src => ({ kind: 'image', src: src, alt: project.title }));
    }

    const otherProjects = projects.filter(p => p.id !== project.id);
    const ratio = project.coverWidth && project.coverHeight ? project.coverWidth / project.coverHeight : 1.77;

    return (
        <ProjectDetailTwoColumn
            project={project}
            cover={cover}
            gallery={gallery}
            ratio={ratio}
            otherProjects={otherProjects}
            isWindowMode={true}
        />
    );
};

export default ProjectDetailWrapper;
