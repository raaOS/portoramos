'use client';

import { Image as ImageIcon, Check } from 'lucide-react';
import Image from 'next/image';
import { Project } from '@/types/projects';
import { TrailItem } from '@/types/about';

interface TrailSelectorProps {
    projects: Project[];
    selectedItems: TrailItem[];
    onChange: (items: TrailItem[]) => void;
    maxItems?: number;
    allowedTypes?: ('image' | 'video')[];
}

export default function TrailSelector({
    projects,
    selectedItems,
    onChange,
    maxItems = 10,
    allowedTypes = ['image', 'video']
}: TrailSelectorProps) {
    // Extract URLs for easy lookup
    const selectedUrls = selectedItems.map(item => item.src);

    // Sort projects by createdAt descending (newest first)
    // AND Filter by allowed types
    const isVideoLink = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

    const checkMediaType = (url: string): 'image' | 'video' => {
        return isVideoLink(url) ? 'video' : 'image';
    };

    const sortedProjects = [...projects]
        .filter(project => allowedTypes.includes(checkMediaType(project.cover)))
        .sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );


    const toggleSelection = (project: Project) => {
        const isSelected = selectedUrls.includes(project.cover);

        if (isSelected) {
            // Remove
            onChange(selectedItems.filter(item => item.src !== project.cover));
        } else {
            // Add
            if (selectedItems.length >= maxItems) {
                // Optional: Toast error handling could be passed down or handled by parent validation
                return;
            }

            const newItem: TrailItem = {
                src: project.cover,
                isActive: true, // Default to active
                slug: project.slug
            };

            onChange([...selectedItems, newItem]);
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedProjects.map(project => {
                const selectedIndex = selectedUrls.indexOf(project.cover);
                const isSelected = selectedIndex !== -1;
                const mediaType = checkMediaType(project.cover);

                return (
                    <div
                        key={project.id}
                        onClick={() => toggleSelection(project)}
                        className={`
              group relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200
              ${isSelected ? 'border-violet-600 ring-2 ring-violet-200 scale-[1.02]' : 'border-transparent hover:border-gray-300'}
            `}
                    >
                        {mediaType === 'video' ? (
                            <video
                                src={project.cover}
                                className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'brightness-100' : 'brightness-90 group-hover:brightness-100'}`}
                                muted
                                loop
                                playsInline
                                // Auto-play on hover logic can be added here if needed, keeping it simple for now
                                onMouseOver={e => e.currentTarget.play()}
                                onMouseOut={e => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                }}
                            />
                        ) : (
                            <Image
                                src={project.cover}
                                alt={project.title}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                className={`object-cover transition-all duration-300 ${isSelected ? 'brightness-100' : 'brightness-90 group-hover:brightness-100'}`}
                            />
                        )}

                        {/* Selection Overlay */}
                        {isSelected ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-violet-600/20 backdrop-blur-[1px]">
                                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white">
                                    {selectedIndex + 1}
                                </div>
                            </div>
                        ) : (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full border border-white/60 bg-black/20 group-hover:bg-white/30 transition-colors" />
                        )}

                        {/* Title Label */}
                        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <p className="text-white text-[10px] font-medium truncate text-center">
                                {project.title}
                            </p>
                        </div>
                    </div>
                );
            })}

            {sortedProjects.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>No compatible projects found.</p>
                    <p className="text-xs mt-1">
                        (Only showing {allowedTypes.join(' & ')} files)
                    </p>
                </div>
            )}
        </div>
    );
}
