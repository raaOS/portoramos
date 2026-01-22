import React, { useMemo, useState } from 'react';
import { Folder, ArrowLeft, Image as ImageIcon, Briefcase } from 'lucide-react';
import type { Project } from '@/types/projects';
import { resolveCover } from '@/lib/images';
import MasonryGrid from '@/components/layout/MasonryGrid';
import Media from '@/components/shared/Media';

interface GalleryWindowProps {
    projects: Project[];
}

// Hardcoded Work Experience List (Ideally synced with Experience API)
const WORK_FOLDERS = [
    { id: 'bitlabs', name: 'PT. Bitlabs Academy', year: '2019-Now', color: 'bg-blue-100 text-blue-600' },
    { id: 'sekolah-desain', name: 'Sekolah Desain', year: '2019-2020', color: 'bg-green-100 text-green-600' },
    { id: 'duta-mode', name: 'PT. Duta Mode', year: '2017-2019', color: 'bg-purple-100 text-purple-600' },
    { id: 'sthal', name: 'Sthal.Co', year: '2016-2017', color: 'bg-orange-100 text-orange-600' },
    { id: 'sari-coffee', name: 'PT Sari Coffee (Starbucks)', year: '2012-2015', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'wulan', name: 'Wulan Boutique', year: '2012', color: 'bg-pink-100 text-pink-600' },
];

export default function GalleryWindow({ projects }: GalleryWindowProps) {
    const [currentPath, setCurrentPath] = useState<string | null>(null);

    // Group photos by "Company"
    // Since we don't have real metadata, we will "distribute" project photos into these folders for demo purposes.
    // In reality, this should fetch "Life at Work" photos.
    const folderContent = useMemo(() => {
        const content: Record<string, any[]> = {};

        // Initialize arrays
        WORK_FOLDERS.forEach(f => content[f.id] = []);

        // Distribute projects into folders randomly/hashed to simulate content
        projects.forEach((p, index) => {
            const cover = resolveCover(p);
            // Hash index to pick a folder
            const folderIndex = index % WORK_FOLDERS.length;
            const folderId = WORK_FOLDERS[folderIndex].id;

            content[folderId].push({
                src: cover.src,
                kind: cover.kind,
                poster: cover.poster,
                title: p.title
            });

            // Add inner gallery items too
            p.galleryItems?.forEach(item => {
                content[folderId].push({
                    src: item.src,
                    kind: item.kind,
                    poster: item.poster,
                    title: p.title
                });
            });
        });

        return content;
    }, [projects]);


    return (
        <div className="flex h-full w-full bg-[#f5f5f7] font-sans flex-col">
            {/* Toolbar / Breadcrumb */}
            <div className="shrink-0 h-10 bg-[#e5e5e7] border-b border-gray-300 flex items-center px-4 gap-2">
                <button
                    onClick={() => setCurrentPath(null)}
                    disabled={!currentPath}
                    className={`p-1 rounded ${!currentPath ? 'text-gray-400 cursor-default' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="h-4 w-[1px] bg-gray-400 mx-2" />
                <div className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 px-2 rounded" onClick={() => setCurrentPath(null)}>
                    <Briefcase size={14} />
                    <span>My Mac</span>
                </div>
                {currentPath && (
                    <>
                        <span className="text-gray-400">/</span>
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 bg-white px-2 py-0.5 rounded shadow-sm">
                            <Folder size={14} className="fill-blue-400 stroke-blue-500" />
                            <span>{WORK_FOLDERS.find(f => f.id === currentPath)?.name}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">

                {/* VIEW: ROOT (FOLDERS) */}
                {!currentPath && (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {WORK_FOLDERS.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => setCurrentPath(folder.id)}
                                className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-blue-50 transition-colors focus:bg-blue-100 outline-none"
                            >
                                <div className="relative">
                                    <Folder size={64} className="fill-sky-400 text-sky-600 drop-shadow-sm group-hover:scale-105 transition-transform" />
                                    {/* Badge count */}
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                        {folderContent[folder.id]?.length || 0}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-medium text-gray-700 block group-hover:text-blue-600 truncate max-w-[100px]">
                                        {folder.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{folder.year}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* VIEW: FOLDER CONTENT (PHOTOS) */}
                {currentPath && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        {folderContent[currentPath]?.length > 0 ? (
                            <MasonryGrid columns="default">
                                {folderContent[currentPath].map((photo, i) => (
                                    <div key={i} className="mb-4 break-inside-avoid">
                                        <div className="relative group overflow-hidden rounded bg-gray-100 border border-gray-200 hover:shadow-md transition-all">
                                            <Media
                                                kind={photo.kind}
                                                src={photo.src}
                                                poster={photo.poster}
                                                width={400}
                                                height={300}
                                                className="w-full h-auto object-cover"
                                                autoplay={false}
                                                priority={i < 4}
                                            />
                                            {/* Filename overlay */}
                                            <div className="absolute bottom-0 inset-x-0 bg-white/90 p-1.5 border-t border-gray-100 translate-y-full group-hover:translate-y-0 transition-transform">
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                                                    <ImageIcon size={10} />
                                                    <span className="truncate">{photo.title}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </MasonryGrid>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                                <Folder size={48} className="text-gray-200 mb-2" />
                                <p>Folder is empty</p>
                            </div>
                        )}
                        <div className="pb-20" />
                    </div>
                )}

            </div>

            {/* Footer Info */}
            <div className="shrink-0 h-6 bg-[#f5f5f7] border-t border-gray-300 flex items-center justify-center text-[10px] text-gray-500">
                {currentPath
                    ? `${folderContent[currentPath]?.length || 0} items`
                    : `${WORK_FOLDERS.length} items, Available on Disk`
                }
            </div>
        </div>
    );
}
