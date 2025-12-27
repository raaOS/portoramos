'use client';

import type { Project } from '@/types/projects';
import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Media from '@/components/shared/Media';
import { resolveCover, resolveGallery } from '@/lib/images';
import ReadMoreDescription from '@/components/ReadMoreDescription';

interface ProjectDetailInlineProps {
    project: Project;
    onClose: () => void;
}

export default function ProjectDetailInline({ project, onClose }: ProjectDetailInlineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cover = resolveCover(project);
    const gallery = resolveGallery(project);

    // Calculate aspect ratio
    const ratio = (project.coverWidth && project.coverHeight)
        ? project.coverWidth / project.coverHeight
        : 16 / 9;

    // Scroll into view when opened
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-full w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 my-4"
        >
            <div className="relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-lg"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* View Full Page Link */}
                <Link
                    href={`/works/${project.slug}`}
                    className="absolute top-4 right-16 z-50 p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-lg"
                    aria-label="View full page"
                >
                    <ExternalLink className="w-5 h-5" />
                </Link>

                {/* Content Grid - Two columns on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Left: Media */}
                    <div className="relative bg-gray-100 dark:bg-gray-800">
                        <div style={{ aspectRatio: Math.min(ratio, 16 / 9) }} className="relative w-full">
                            <Media
                                kind={cover.kind}
                                src={cover.src}
                                poster={cover.poster}
                                alt={project.title}
                                width={project.coverWidth || 800}
                                height={project.coverHeight || 600}
                                priority={true}
                                autoplay={project.autoplay ?? true}
                                muted={project.muted ?? true}
                                loop={project.loop ?? true}
                                playsInline={project.playsInline ?? true}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Gallery thumbnails */}
                        {gallery && gallery.length > 0 && (
                            <div className="flex gap-2 p-4 overflow-x-auto">
                                {gallery.slice(0, 5).map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
                                    >
                                        <Media
                                            kind={item.type === 'video' ? 'video' : 'image'}
                                            src={item.src}
                                            alt={`Gallery ${index + 1}`}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                                {gallery.length > 5 && (
                                    <Link
                                        href={`/works/${project.slug}`}
                                        className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-sm font-medium hover:bg-gray-300 transition-colors"
                                    >
                                        +{gallery.length - 5}
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="p-6 lg:p-8 space-y-4 overflow-y-auto max-h-[70vh]">
                        {/* Title */}
                        <h2 className="text-2xl lg:text-3xl font-sans font-bold text-gray-900 dark:text-white">
                            {project.title}
                        </h2>

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-2">
                            {project.year && (
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
                                    {project.year}
                                </span>
                            )}
                            {project.client && (
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
                                    {project.client}
                                </span>
                            )}
                        </div>

                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map((tag: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-black text-white rounded-full text-xs font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        {project.description && (
                            <ReadMoreDescription
                                text={project.description}
                                maxLines={6}
                                className="text-base leading-relaxed text-gray-700 dark:text-gray-300"
                            />
                        )}

                        {/* View Full Project Button */}
                        <div className="pt-4">
                            <Link
                                href={`/works/${project.slug}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-80 transition-opacity"
                            >
                                View Full Project
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
