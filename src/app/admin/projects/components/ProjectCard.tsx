import React from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Copy, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { Project } from '@/types/projects';
import { isVideoLink } from '@/lib/media';
import { getIconMap } from '@/constants/skillIcons';
import StatusToggle from '../../components/StatusToggle';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';

interface ProjectCardProps {
    project: Project;
    selectedProjectIds: Set<string>;
    toggleProjectSelection: (id: string) => void;
    handleToggleProjectStatus: (project: Project) => void;
    setEditingProject: (project: Project) => void;
    handleDeleteProject: (id: string) => void;
    handleDuplicateProject: (project: Project) => void;
    setManagingCommentsProject: (project: Project) => void;
    commentCount?: number;
    priority?: boolean;
    eager?: boolean;
}

export const ProjectCard = ({
    project,
    selectedProjectIds,
    toggleProjectSelection,
    handleToggleProjectStatus,
    setEditingProject,
    handleDeleteProject,
    handleDuplicateProject,
    setManagingCommentsProject,
    commentCount: _commentCount = 0,
    priority = false,
    eager = false
}: ProjectCardProps) => {
    const isPublished = project.status === 'published';
    const shouldLoadEagerly = priority || eager;

    return (
        <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden h-full">
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                {/* Selection Checkbox Overlay */}
                <div
                    className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${selectedProjectIds.has(project.id) || 'group-hover:opacity-100 opacity-0'}`}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={selectedProjectIds.has(project.id)}
                        onChange={() => toggleProjectSelection(project.id)}
                        className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer shadow-sm"
                    />
                </div>

                {isVideoLink(project.cover) ? (
                    <video src={project.cover + '#t=0.1'} className="w-full h-full object-cover" muted loop playsInline preload="metadata" />
                ) : (
                    <Image
                        src={project.cover || FALLBACK_IMAGE}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={priority}
                        loading={shouldLoadEagerly ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                    />
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1 gap-2">
                        <h3
                            className="text-lg font-bold text-gray-900 line-clamp-1 flex-1 cursor-pointer hover:text-violet-600"
                            title={project.title}
                            onClick={() => toggleProjectSelection(project.id)}
                        >
                            {project.title}
                        </h3>
                        <div onPointerDown={(e) => e.stopPropagation()}>
                            <StatusToggle
                                isActive={isPublished}
                                onClick={() => handleToggleProjectStatus(project)}
                                className="flex-shrink-0"
                                iconActive={<Eye className="w-4 h-4" />}
                                iconInactive={<EyeOff className="w-4 h-4" />}
                                labelActive=""
                                labelInactive=""
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-violet-600 font-medium">{project.client} • {project.year}</p>
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                            {project.software?.slice(0, 3).map(s => (
                                <div key={s} title={s.replace('_', ' ')} className="w-4 h-4">
                                    {getIconMap("w-full h-full")[s.toLowerCase()] || (
                                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-[6px] font-bold text-gray-500 uppercase">
                                            {s.slice(0, 2)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                </div>

                <div className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-4" onPointerDown={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setEditingProject(project)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                        title="Edit Project"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDuplicateProject(project)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Duplicate Project"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Project"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setManagingCommentsProject(project)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                        title="Manage Comments"
                    >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                    </button>
                </div>
            </div>
        </div>
    );
};
