import React, { useState, useEffect } from 'react';
import { X, Trash2, Search, CheckCircle2, Loader2, Image as ImageIcon, RotateCcw } from 'lucide-react';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface IconPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    currentIcon?: string;
}

export default function IconPickerModal({ isOpen, onClose, onSelect, currentIcon }: IconPickerModalProps) {
    const [icons, setIcons] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const { csrfToken } = useAdminAuth();

    useEffect(() => {
        if (!isOpen) return;

        const fetchIcons = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/icons?v=${Date.now()}`);
                const data = await res.json();
                if (data.icons) setIcons(data.icons);
            } catch (e) {
                console.error('Failed to fetch icons', e);
            } finally {
                setLoading(false);
            }
        };

        fetchIcons();
    }, [isOpen, refreshTrigger]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleIconClick = (url: string) => {
        if (selectedUrl) return; // Prevent double clicks
        setSelectedUrl(url);
        // Delay to show animation
        setTimeout(() => {
            onSelect(url);
            setSelectedUrl(null); // Reset for next time
        }, 300);
    };

    const handleDelete = async (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        if (!window.confirm('Hapus ikon ini secara permanen?')) return;

        try {
            const res = await fetch(`/api/admin/icons?url=${encodeURIComponent(url)}`, {
                method: 'DELETE',
                headers: {
                    'x-csrf-token': csrfToken
                }
            });
            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                const data = await res.json();
                alert(`Gagal menghapus ikon: ${data.error || 'Permission Denied'}`);
            }
        } catch (e) {
            console.error('Delete error', e);
            alert('Terjadi kesalahan saat menghapus');
        }
    };

    if (!isOpen) return null;

    const filteredIcons = icons.filter(icon =>
        icon.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Icon Library</h2>
                        <p className="text-sm text-gray-500">Pilih dari koleksi atau upload ikon baru</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Sidebar / Upload Area */}
                    <div className="w-full md:w-72 border-r border-gray-100 p-6 bg-gray-50/50 flex flex-col gap-6">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Quick Upload</h3>
                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 transition-all hover:border-blue-400 group">
                                <AdminFileUpload
                                    folder="assets/icons-library"
                                    multiple={true}
                                    accept="image/*,.icns"
                                    onUpload={() => setRefreshTrigger(prev => prev + 1)}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight">
                                Dukungan .icns, .png, .webp. Otomatis dikonversi & dioptimasi.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Search</h3>
                                <button
                                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-500"
                                    title="Refresh Library"
                                >
                                    <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari ikon..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Gallery Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 className="animate-spin" size={32} />
                                <p className="text-sm">Memuat galeri ikon...</p>
                            </div>
                        ) : filteredIcons.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredIcons.map((iconUrl, idx) => {
                                    const isSelected = selectedUrl === iconUrl;
                                    const isActive = currentIcon === iconUrl || isSelected;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleIconClick(iconUrl)}
                                            className={`aspect-square rounded-2xl border-2 transition-all group relative flex items-center justify-center p-2 cursor-pointer
                                                ${isActive ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'}
                                                ${isSelected ? 'scale-95 ring-4 ring-blue-500/20' : ''}
                                                ${selectedUrl ? 'pointer-events-none opacity-50' : ''}
                                            `}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={iconUrl}
                                                alt="icon"
                                                className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-110"
                                            />
                                            {isActive && (
                                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-lg animate-in zoom-in duration-200">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}

                                            {/* Delete Button - Using Trash icon now, bottom-right and subtle */}
                                            <button
                                                onClick={(e) => handleDelete(e, iconUrl)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    handleDelete(e, iconUrl);
                                                }}
                                                className="absolute bottom-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20 p-1.5 rounded-lg hover:bg-red-50"
                                                title="Hapus ikon (Klik kanan juga bisa)"
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-2xl transition-colors" />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <ImageIcon size={48} className="opacity-20" />
                                <p className="text-sm font-medium">Belum ada ikon di folder ini.</p>
                                <p className="text-xs text-gray-500">Upload beberapa file untuk memulai.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
