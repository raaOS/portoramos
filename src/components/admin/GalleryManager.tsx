'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Project } from '@/types/projects';
import { GalleryFeaturedData } from '@/types/gallery';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface GalleryManagerProps {
    projects: Project[];
}

export default function GalleryManager({ projects }: GalleryManagerProps) {
    const { showSuccess, showError } = useToast();
    const [featuredIds, setFeaturedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { csrfToken } = useAdminAuth();

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
                return prev.filter(id => id !== projectId);
            } else {
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
            const res = await fetch('/api/gallery/featured', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ featuredProjectIds: featuredIds })
            });

            if (!res.ok) throw new Error('Failed to save gallery');
            showSuccess('Gallery updated successfully!');
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

    const sortedProjects = [...projects].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const isVideoLink = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

    return (
        <div className="space-y-6">
            {/* Gallery Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-blue-800">Gallery Management</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Pilih up to 10 project untuk tampil di &quot;About&quot; page Sticky Gallery.
                    </p>
                </div>
            </div>

            {/* Save Bar */}
            <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-4 border-b">
                <div className="text-sm text-gray-500">
                    Selected: <span className="font-bold text-gray-900">{featuredIds.length}</span> / 10
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </button>
            </div>

            {/* Project Grid */}
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
                                    src={project.cover + '#t=0.1'}
                                    className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'brightness-100' : 'brightness-90 group-hover:brightness-100'}`}
                                    muted
                                    loop
                                    playsInline
                                    autoPlay={false}
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

                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-violet-600/40">
                                    <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center text-xl font-bold shadow-xl border-4 border-white">
                                        {selectedIndex + 1}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
