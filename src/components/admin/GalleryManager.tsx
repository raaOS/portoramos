'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Project } from '@/types/projects';
import { GalleryFeaturedData } from '@/types/gallery';
import { Save, Loader2, AlertCircle, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ChevronDown, ChevronUp, FileX } from 'lucide-react';

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
    const [auditInfo, setAuditInfo] = useState<{ 
        total: number, 
        orphans: Array<{name: string, inGithub: boolean, reason: string}>,
        usedAssetsList?: string[]
    } | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [showOrphanList, setShowOrphanList] = useState(false);
    const [showUsedAssets, setShowUsedAssets] = useState(false);

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

    const handleAudit = async () => {
        setIsAuditing(true);
        try {
            const res = await fetch('/api/admin/audit-assets');
            if (res.ok) {
                const data = await res.json();
                setAuditInfo({
                    total: data.stats.orphanFilesCount,
                    orphans: data.orphanFiles,
                    usedAssetsList: data.usedAssetsList
                });
                
                // Show warning if there are local-only files
                const localOnlyCount = data.orphanFiles.filter((f: any) => !f.inGithub).length;
                if (localOnlyCount > 0) {
                    showSuccess(`Audit: ${data.stats.orphanFilesCount} file tidak terpakai (${localOnlyCount} belum di-push ke GitHub)`);
                } else {
                    showSuccess(`Audit complete: ${data.stats.orphanFilesCount} file tidak terpakai.`);
                }
            } else {
                throw new Error('Audit failed');
            }
        } catch (error) {
            showError('Failed to run asset audit');
        } finally {
            setIsAuditing(false);
        }
    };

    const handleCleanup = async () => {
        if (!auditInfo || auditInfo.total === 0) return;
        
        // Separate files by location
        const githubFiles = auditInfo.orphans.filter(f => f.inGithub).map(f => f.name);
        const localOnlyFiles = auditInfo.orphans.filter(f => !f.inGithub).map(f => f.name);
        
        let confirmMessage = '';
        if (githubFiles.length > 0 && localOnlyFiles.length > 0) {
            confirmMessage = `Hapus ${githubFiles.length} file dari GitHub dan ${localOnlyFiles.length} file local only?`;
        } else if (githubFiles.length > 0) {
            confirmMessage = `Hapus ${githubFiles.length} file PERMANEN dari GitHub?`;
        } else {
            confirmMessage = `Hapus ${localOnlyFiles.length} file dari local storage?`;
        }
        
        if (!window.confirm(confirmMessage + "\n\nTindakan ini tidak bisa dibatalkan.")) return;

        setIsCleaning(true);
        try {
            // Only send filenames (backend will handle paths)
            const allFilenames = auditInfo.orphans.map(f => f.name);
            
            const res = await fetch('/api/admin/audit-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ files: allFilenames })
            });

            if (res.ok) {
                const result = await res.json();
                showSuccess(result.message);
                // Refresh audit after cleanup
                handleAudit();
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Cleanup failed');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to cleanup assets');
        } finally {
            setIsCleaning(false);
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-blue-800">Gallery Management</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Select up to 10 projects to feature in the &quot;About&quot; page Sticky Gallery.
                        <br />
                        <strong>Order matters!</strong> The number badge (1, 2, 3...) indicates the stacking order.
                    </p>
                </div>
            </div>

            {/* GitHub Asset Cleanup Section */}
            <div className={`p-4 rounded-lg border ${auditInfo && auditInfo.total > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-3 items-start">
                        <Trash2 className={`w-5 h-5 mt-0.5 ${auditInfo && auditInfo.total > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                        <div>
                            <h3 className={`font-semibold text-sm ${auditInfo && auditInfo.total > 0 ? 'text-amber-800' : 'text-gray-700'}`}>
                                Cleanup GitHub Assets
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {auditInfo
                                    ? `Found ${auditInfo.total} unused files in GitHub storage.`
                                    : "Check for unused files (sampah) in your GitHub repository."}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAudit}
                            disabled={isAuditing || isCleaning}
                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAuditing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                            {auditInfo ? "Re-scan" : "Scan for Waste"}
                        </button>
                        {auditInfo && auditInfo.total > 0 && (
                            <>
                                <button
                                    onClick={() => setShowOrphanList(!showOrphanList)}
                                    className="px-3 py-1.5 text-xs font-medium border border-amber-300 bg-white text-amber-700 rounded hover:bg-amber-50 transition-colors flex items-center gap-2"
                                >
                                    {showOrphanList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    Lihat {auditInfo.total} File
                                </button>
                                <button
                                    onClick={handleCleanup}
                                    disabled={isCleaning}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {isCleaning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    Hapus Semua
                                </button>
                            </>
                        )}
                        {auditInfo && auditInfo.total === 0 && (
                            <div className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> Repositori Bersih
                            </div>
                        )}
                    </div>
                </div>

                {/* Orphan Files List */}
                {auditInfo && auditInfo.total > 0 && showOrphanList && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-2">
                            <FileX className="w-3.5 h-3.5" />
                            File yang akan dihapus:
                        </h4>
                        <div className="bg-white rounded border border-amber-100 max-h-60 overflow-y-auto">
                            <ul className="divide-y divide-amber-50">
                                {auditInfo.orphans.map((file, index) => (
                                    <li key={index} className={`px-3 py-2 text-xs hover:bg-amber-50/50 flex items-center gap-2 ${!file.inGithub ? 'bg-blue-50/50' : ''}`}>
                                        <span className="text-gray-400 font-mono w-5">{index + 1}.</span>
                                        <span className="truncate flex-1" title={file.name}>{file.name}</span>
                                        {!file.inGithub ? (
                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">
                                                Local Only
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded">
                                                GitHub
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-2 space-y-1">
                            <p className="text-[10px] text-amber-600">
                                * File dengan label &quot;Local Only&quot; belum di-push ke GitHub (aman dihapus dari local saja).
                            </p>
                            <p className="text-[10px] text-amber-600">
                                * File dengan label &quot;GitHub&quot; akan dihapus permanen dari repositori.
                            </p>
                        </div>
                    </div>
                )}

                {/* Debug: Used Assets List */}
                {showUsedAssets && auditInfo?.usedAssetsList && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Assets yang terdeteksi digunakan:</h4>
                        <div className="bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto p-2">
                            <ul className="text-[10px] text-gray-600 space-y-1">
                                {auditInfo.usedAssetsList.map((asset, i) => (
                                    <li key={i} className="truncate">{asset}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
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

                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 ${isSelected ? 'opacity-100' : ''}`}>
                                {isSelected ? null : <p className="text-white text-xs font-medium line-clamp-2">{project.title}</p>}
                            </div>

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
