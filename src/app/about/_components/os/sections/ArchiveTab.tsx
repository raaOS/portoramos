import React from "react";
import { getProxiedUrl } from "@/lib/utils";
import Image from "next/image";
import type { Project } from "@/types/projects";

interface ArchiveTabProps {
    archiveProjects: Project[];
}

export const ArchiveTab = ({ archiveProjects }: ArchiveTabProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">Archive</h1>
            <p className="text-gray-600 text-sm">
                Experimental works, visual art, and personal explorations.
                These projects showcase style range outside of commercial constraints.
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {archiveProjects.map((project) => (
                <div key={project.id} className="group relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {project.type === 'visual_art' && (
                        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                            Art
                        </div>
                    )}
                    {project.cover.endsWith('.mp4') ? (
                        <video
                            src={getProxiedUrl(project.cover)}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="none"
                        />
                    ) : (
                        <Image
                            src={getProxiedUrl(project.cover)}
                            alt={project.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent pt-8">
                        <h3 className="text-white text-sm font-bold truncate">{project.title}</h3>
                        <p className="text-white/70 text-xs truncate">{project.tags.join(', ')}</p>
                    </div>
                </div>
            ))}
            {archiveProjects.length === 0 && (
                <p className="text-gray-400 italic col-span-2 text-center py-8">No archived projects found.</p>
            )}
        </div>
    </div>
);
