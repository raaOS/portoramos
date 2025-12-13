'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Eye } from 'lucide-react';
import { Project } from '@/types/projects';
import { generateBlurDataURL } from '@/utils/blurDataURL';

interface ProjectCardPinterestProps {
    project: Project;
    priority?: boolean;
}

export default function ProjectCardPinterest({ project, priority = false }: ProjectCardPinterestProps) {
    const { slug, title, client, cover, year } = project;

    return (
        <Link href={`/work/${slug}`} className="block group">
            <div className="relative overflow-hidden rounded-xl bg-gray-100 transition-transform duration-300 hover:scale-[1.02]">
                {/* Image */}
                <div className="relative w-full">
                    <Image
                        src={cover || '/images/placeholder.jpg'}
                        alt={title}
                        width={600}
                        height={800}
                        className="w-full h-auto object-cover"
                        placeholder="blur"
                        blurDataURL={generateBlurDataURL(cover || '')}
                        priority={priority}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Project Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2">{title}</h3>
                        <div className="flex items-center justify-between text-sm">
                            <p className="text-white/90">{client}</p>
                            <p className="text-white/70">{year}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                window.open(`/work/${slug}`, '_blank');
                            }}
                            className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors shadow-lg"
                            aria-label="Open in new tab"
                        >
                            <ExternalLink className="w-4 h-4 text-black" />
                        </button>
                        <div className="bg-white/90 p-2 rounded-full shadow-lg">
                            <Eye className="w-4 h-4 text-black" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
