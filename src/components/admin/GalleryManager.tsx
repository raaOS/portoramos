'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Project } from '@/types/projects';
import { GalleryFeaturedData } from '@/types/gallery';
import { Save, Loader2, AlertCircle, Trash2, Search, CheckCircle2, ChevronDown, ChevronUp, FileX, UploadCloud, Shield } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface GalleryManagerProps {
    projects: Project[];
    onSyncTrigger: (projectsToSync?: Project[], skipConfirm?: boolean, galleryIds?: string[]) => Promise<void>;
}

export default function GalleryManager({ projects, onSyncTrigger }: GalleryManagerProps) {
    const { showSuccess, showError } = useToast();
    const [featuredIds, setFeaturedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { csrfToken } = useAdminAuth();

    // Cleanup states
    const [cleanupStep, setCleanupStep] = useState<'idle' | 'pushing' | 'scanning' | 'done'>('idle');
    const [orphanFiles, setOrphanFiles] = useState<string[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
    const [showDetails, setShowDetails] = useState(false);

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

            if (!res.ok) throw new Error('Failed to save to local API');
            await onSyncTrigger(undefined, true, featuredIds);
            showSuccess('Gallery updated & synced!');
        } catch (error) {
            console.error(error);
            showError('Failed to save gallery');
        } finally {
            setSaving(false);
        }
    };

    // Simplified Cleanup: Push then Scan
    const handleCleanup = async () => {
        setCleanupStep('pushing');
        setProgress({ current: 0, total: 1, message: 'Mengunggah file ke GitHub...' });

        try {
            // Step 1: Push all local changes
            const syncRes = await fetch('/api/admin/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ action: 'full-sync' })
            });

            if (!syncRes.ok) {
                const err = await syncRes.json();
                throw new Error(err.error || 'Sync failed');
            }

            // Step 2: Scan for orphans
            setCleanupStep('scanning');
            setProgress({ current: 1, total: 2, message: 'Mencari file tidak terpakai...' });

            const auditRes = await fetch('/api/admin/audit-assets-simple');
            if (!auditRes.ok) throw new Error('Scan failed');

            const data = await auditRes.json();
            setOrphanFiles(data.orphanFiles || []);
            setCleanupStep('done');

            if (data.orphanFiles.length === 0) {
                showSuccess('Semua file sudah tersinkron! Tidak ada sampah.');
            } else {
                showSuccess(`Ditemukan ${data.orphanFiles.length} file tidak terpakai`);
            }
        } catch (error: any) {
            showError(error.message || 'Gagal cleanup');
            setCleanupStep('idle');
        }
    };

    const handleDeleteOrphans = async () => {
        if (orphanFiles.length === 0) return;
        if (!window.confirm(`Hapus ${orphanFiles.length} file dari GitHub?\n\nFile yang dihapus tidak bisa dikembalikan.`)) return;

        setProgress({ current: 0, total: orphanFiles.length, message: 'Menghapus file...' });

        try {
            const res = await fetch('/api/admin/audit-assets-simple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ files: orphanFiles })
            });

            if (res.ok) {
                showSuccess(`${orphanFiles.length} file berhasil dihapus`);
                setOrphanFiles([]);
                setCleanupStep('idle');
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            showError('Gagal menghapus file');
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-violet-600" /></div>;
    }

    const sortedProjects = [...projects].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const isVideoLink = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

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

            {/* Simple Cleanup Section */}
            <div className={`p-4 rounded-lg border ${cleanupStep !== 'idle' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                        {cleanupStep === 'idle' && <UploadCloud className="w-5 h-5 text-gray-400" />}
                        {cleanupStep === 'pushing' && <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />}
                        {cleanupStep === 'scanning' && <Search className="w-5 h-5 text-amber-600 animate-pulse" />}
                        {cleanupStep === 'done' && (orphanFiles.length > 0 ? <FileX className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />)}
                        
                        <div>
                            <h3 className={`font-semibold text-sm ${cleanupStep !== 'idle' ? 'text-amber-800' : 'text-gray-700'}`}>
                                {cleanupStep === 'idle' && 'Sinkronisasi & Cleanup'}
                                {cleanupStep === 'pushing' && 'Mengunggah ke GitHub...'}
                                {cleanupStep === 'scanning' && 'Mencari file sampah...'}
                                {cleanupStep === 'done' && (orphanFiles.length > 0 ? `${orphanFiles.length} file tidak terpakai` : 'Semua tersinkron!')}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {cleanupStep === 'idle' && 'Push file baru & hapus file lama'}
                                {cleanupStep === 'pushing' && progress.message}
                                {cleanupStep === 'scanning' && progress.message}
                                {cleanupStep === 'done' && (orphanFiles.length > 0 ? 'File bisa dihapus aman' : 'Tidak ada tindakan perlu')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {cleanupStep === 'idle' && (
                            <button
                                onClick={handleCleanup}
                                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                            >
                                <UploadCloud className="w-4 h-4" />
                                Sync & Cleanup
                            </button>
                        )}

                        {cleanupStep === 'done' && orphanFiles.length > 0 && (
                            <>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white"
                                >
                                    {showDetails ? 'Sembunyikan' : 'Lihat File'}
                                </button>
                                <button
                                    onClick={handleDeleteOrphans}
                                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus {orphanFiles.length}
                                </button>
                            </>
                        )}

                        {cleanupStep === 'done' && orphanFiles.length === 0 && (
                            <button
                                onClick={() => setCleanupStep('idle')}
                                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg"
                            >
                                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                Selesai
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {(cleanupStep === 'pushing' || cleanupStep === 'scanning') && (
                    <div className="mt-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-amber-500 transition-all duration-500"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Orphan Files List */}
                {cleanupStep === 'done' && orphanFiles.length > 0 && showDetails && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                        <ul className="text-sm space-y-1">
                            {orphanFiles.map((file, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-600">
                                    <FileX className="w-3 h-3 text-gray-400" />
                                    {file}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Safety Note */}
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <p>File yang masih digunakan oleh project tidak akan terhapus. Sistem akan scan local JSON sebagai acuan.</p>
                </div>
            </div>

            {/* Save Bar */}
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
                                    src={project.cover}
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
                                <div className="absolute inset-0 flex items-center justify-center bg-violet-600/20 backdrop-blur-[2px]">
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
