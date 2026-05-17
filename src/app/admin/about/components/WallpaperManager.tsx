import React, { useState } from 'react';
import { Plus, Check, Trash2, Loader2 } from 'lucide-react';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import { WallpaperConfig, Wallpaper } from '@/types/about';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { extractStoragePath } from '@/lib/media';

interface WallpaperManagerProps {
    data?: WallpaperConfig;
    onUpdate: (data: WallpaperConfig) => void;
}

const DEFAULT_WALLPAPERS = [
    { id: 'default', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070', name: 'Cyberpunk' },
    { id: 'minimal', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070', name: 'Alps' },
];

export default function WallpaperManager({ data, onUpdate }: WallpaperManagerProps) {
    const { csrfToken } = useAdminAuth();
    const [wallpapers, setWallpapers] = useState<Wallpaper[]>(DEFAULT_WALLPAPERS);
    const [activeId, setActiveId] = useState<string>('default');
    // Local state for blur — only saves to database on pointer/mouse up (not every keystroke)
    const [blurValue, setBlurValue] = useState<number>(data?.blur || 0);
    const [isUploading, setIsUploading] = useState(false);

    // Sync state with props in render
    const [lastData, setLastData] = useState(data);
    if (data && data !== lastData) {
        if (data.collection && data.collection.length > 0) {
            setWallpapers(data.collection);
            setActiveId(data.activeWallpaperId || 'default');
        }
        // Sync local blur value when external data changes (e.g. initial load)
        setBlurValue(data.blur ?? 0);
        setLastData(data);
    }

    const handleUpload = (urls: string[]) => {
        if (!urls || urls.length === 0) return;

        const newWallpapers: Wallpaper[] = urls.map(url => ({
            id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: url,
            name: 'Custom Wallpaper'
        }));

        const newCollection = [...wallpapers, ...newWallpapers];
        setWallpapers(newCollection);
        // Auto-select the first new wallpaper
        const newActiveId = newWallpapers[0].id;
        setActiveId(newActiveId);

        onUpdate({
            activeWallpaperId: newActiveId,
            collection: newCollection,
            blur: data?.blur
        });
    };

    const handleDelete = async (id: string) => {
        const wallpaperToDelete = wallpapers.find(w => w.id === id);

        const storagePath = wallpaperToDelete ? extractStoragePath(wallpaperToDelete.url) : null;
        if (wallpaperToDelete && storagePath) {
            const confirmDelete = window.confirm(
                "Hapus wallpaper ini secara permanen dari Storage?\n\nOK = Hapus fisik\nBatal = Hanya hapus dari daftar (bisa jadi sampah)"
            );

            if (confirmDelete) {
                try {
                    await fetch(`/api/upload?path=${encodeURIComponent(storagePath)}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: {
                            'x-csrf-token': csrfToken || ''
                        }
                    });
                } catch (e) {
                    console.error("Failed to delete physical wallpaper file", e);
                }
            } else {
                return; // User cancelled
            }
        }

        const newCollection = wallpapers.filter(w => w.id !== id);
        setWallpapers(newCollection);
        // If active was deleted, reset to first
        let newActive = activeId;
        if (activeId === id) {
            newActive = newCollection[0]?.id || 'default';
            setActiveId(newActive);
        }
        onUpdate({
            activeWallpaperId: newActive,
            collection: newCollection,
            blur: data?.blur
        });
    };

    const handleSetActive = (id: string) => {
        setActiveId(id);
        onUpdate({
            activeWallpaperId: id,
            collection: wallpapers,
            blur: data?.blur
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Desktop Wallpaper</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Pilih wallpaper utama sistem. Klik untuk menerapkan (Auto-Save).
                </p>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Blur Intensity (0-20px)
                        </label>
                        <span className="text-sm px-2 py-1 bg-white rounded border border-gray-200 text-gray-600 font-mono">
                            {blurValue}px
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={blurValue}
                        onChange={(e) => setBlurValue(parseInt(e.target.value))}
                        onPointerUp={(e) => onUpdate({ ...data!, collection: wallpapers, activeWallpaperId: activeId, blur: parseInt((e.target as HTMLInputElement).value) })}
                        onMouseUp={(e) => onUpdate({ ...data!, collection: wallpapers, activeWallpaperId: activeId, blur: parseInt((e.target as HTMLInputElement).value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Geser untuk mengatur tingkat keburaman wallpaper desktop. 0 = Tajam.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Wallpaper Hero (Optional Visual Emphasis) */}

                    {wallpapers.map(wp => {
                        const isActive = activeId === wp.id;
                        return (
                            <div
                                key={wp.id}
                                onClick={() => handleSetActive(wp.id)}
                                className={`
                                    group relative aspect-video rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                                    ${isActive
                                        ? 'ring-4 ring-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02]'
                                        : 'ring-1 ring-gray-200 hover:shadow-xl hover:-translate-y-1'
                                    }
                                `}
                            >
                                <img src={wp.url} alt={wp.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                                {/* Active Badge */}
                                <div className={`absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-0'}`}>
                                    <Check size={16} strokeWidth={3} />
                                </div>

                                {/* Overlay & Info */}
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 ${isActive ? 'opacity-100' : ''}`}>
                                    <p className="text-white font-medium text-lg drop-shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        {isActive ? 'Active Wallpaper' : wp.name || 'Wallpaper'}
                                    </p>
                                    <span className="text-[10px] text-white/80 font-mono mt-1 uppercase tracking-widest">
                                        {isActive ? 'Applied' : 'Click to Apply'}
                                    </span>
                                </div>

                                {/* Delete Action */}
                                {wp.id !== 'default' && wp.id !== 'minimal' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(wp.id); }}
                                        className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white hover:bg-red-500 hover:text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                        title="Delete Wallpaper"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {/* Clean Upload Area */}
                    <div className={`relative aspect-video rounded-2xl border-3 border-dashed ${isUploading ? 'border-amber-400 bg-amber-50/20' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50 hover:bg-blue-50/10'} flex flex-col items-center justify-center transition-all group cursor-pointer gap-4`}>
                        <div className={`p-4 rounded-full shadow-sm transition-transform text-blue-500 ${isUploading ? 'bg-amber-50' : 'bg-white group-hover:scale-110'}`}>
                            {isUploading ? <Loader2 size={32} className="animate-spin text-amber-500" /> : <Plus size={32} />}
                        </div>
                        <div className="text-center">
                            <h4 className="font-semibold text-gray-700">{isUploading ? 'Mengupload...' : 'Upload New'}</h4>
                            <p className="text-xs text-gray-400 mt-1">{isUploading ? 'Harap tunggu...' : '1920x1080 or higher rec.'}</p>
                        </div>
                        {!isUploading && (
                            <div className='absolute inset-0 opacity-0 cursor-pointer overflow-hidden'>
                                <AdminFileUpload
                                    folder="wallpapers"
                                    onUpload={handleUpload}
                                    onUploadStart={() => setIsUploading(true)}
                                    onUploadEnd={() => setIsUploading(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
