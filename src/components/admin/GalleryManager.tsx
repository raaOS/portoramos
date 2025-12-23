'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Project } from '@/types/projects';
import { GalleryFeaturedData } from '@/types/gallery';
import { Check, Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface GalleryManagerProps {
    projects: Project[];
    onSyncTrigger: (projectsToSync?: Project[], skipConfirm?: boolean, galleryIds?: string[]) => Promise<void>;
}

export default function GalleryManager({ projects, onSyncTrigger }: GalleryManagerProps) {
    const { showSuccess, showError } = useToast();
    const [featuredIds, setFeaturedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/gallery/featured');
                if (res.ok) {
                    const data: GalleryFeaturedData = await res.json();
                    setFeaturedIds(data.featuredProjectIds || []);
                }
            } catch (error) {
                console.error('Failed to fetch gallery data', error);
                showError('Failed to load gallery settings');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showError]);

    const toggleSelection = (projectId: string) => {
        setFeaturedIds(prev => {
            if (prev.includes(projectId)) {
                // Remove: filter out and re-index implicitly
                return prev.filter(id => id !== projectId);
            } else {
                // Add: append to end if < 10
                if (prev.length >= 10) {
                    showError('Maximum 10 items allowed');
                    return prev;
                }
                return [...prev, projectId];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Save to local JSON API
            const res = await fetch('/api/gallery/featured', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featuredProjectIds: featuredIds })
            });

            if (!res.ok) throw new Error('Failed to save to local API');

            // 2. Trigger GitHub Sync
            // We pass the new featuredIds so the parent can specifically sync them if needed
            // Or relies on the parent's generic sync logic which might need updating
            await onSyncTrigger(undefined, true, featuredIds);

            showSuccess('Gallery updated & synced!');
        } catch (error) {
            console.error(error);
            showError('Failed to save gallery');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-violet-600" /></div>;
    }

    // Sort projects: Selected first (sorted by index), then unselected
    // Actually, for display, let's just show the grid of ALL projects, but highlight selected ones.
    // This is easier for the user to find projects to add.
    // We can sort by date or title normally.
    const sortedProjects = [...projects].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Helper
    const isVideoLink = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-blue-800">Gallery Management</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Select up to 10 projects to feature in the "About" page Sticky Gallery.
                        <br />
                        <strong>Order matters!</strong> The number badge (1, 2, 3...) indicates the stacking order.
                        Uncheck a project to remove it from the list.
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur z-10 py-4 border-b">
                <div className="text-sm text-gray-500">
                    Selected: <span className="font-bold text-gray-900">{featuredIds.length}</span> / 10
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save & Sync
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedProjects.map(project => {
                    const selectedIndex = featuredIds.indexOf(project.id);
                    const isSelected = selectedIndex !== -1;
                    const isVideo = isVideoLink(project.cover);

                    return (
                        <div
                            key={project.id}
                            onClick={() => toggleSelection(project.id)}
                            className={`
                group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200
                ${isSelected ? 'border-violet-600 ring-2 ring-violet-200 scale-[1.02]' : 'border-transparent hover:border-gray-300'}
              `}
                        >
                            {isVideo ? (
                                <video
                                    src={project.cover}
                                    className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'brightness-100' : 'brightness-90 group-hover:brightness-100'}`}
                                    muted
                                    loop
                                    playsInline
                                    autoPlay={false} // Don't autoplay all in grid to save performance, or maybe specific interactions
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

                            {/* Overlay Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 ${isSelected ? 'opacity-100' : ''}`}>
                                {isSelected ? null : <p className="text-white text-xs font-medium line-clamp-2">{project.title}</p>}
                            </div>

                            {/* Selection Badge (WhatsApp Style) */}
                            {isSelected ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-violet-600/20 backdrop-blur-[2px]">
                                    <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center text-xl font-bold shadow-xl border-4 border-white transform scale-100 transition-transform">
                                        {selectedIndex + 1}
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white/50 bg-black/20 group-hover:bg-white/20 transition-colors" />
                            )}

                            {isSelected && (
                                <div className="absolute bottom-3 left-0 right-0 text-center px-2">
                                    <p className="text-white text-xs font-medium truncate drop-shadow-md">{project.title}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
