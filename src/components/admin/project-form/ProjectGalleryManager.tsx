import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { CheckCircle2, Plus, FolderPlus, Trash2, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { useFirebaseUpload } from '@/app/admin/components/file-upload/hooks';
import { extractStoragePath } from '@/lib/media';

interface ProjectGalleryManagerProps {
    formData: ProjectFormData;
    addGalleryItem: (url: string) => boolean;
    removeGalleryItem: (index: number) => void;
    toggleGalleryItem: (index: number) => void;
    addGalleryGroup: (name: string) => void;
    removeGalleryGroup: (groupId: string) => void;
    addGalleryItemToGroup: (groupId: string, url: string) => boolean;
    removeGalleryItemFromGroup: (groupId: string, itemIndex: number) => void;
    toggleGalleryItemInGroup: (groupId: string, itemIndex: number) => void;
    updateGroupName: (groupId: string, name: string) => void;
    onNewUpload?: (url: string) => void;
}

export default function ProjectGalleryManager({
    formData,
    addGalleryItem,
    removeGalleryItem,
    toggleGalleryItem,
    addGalleryGroup,
    removeGalleryGroup,
    addGalleryItemToGroup,
    removeGalleryItemFromGroup,
    toggleGalleryItemInGroup,
    updateGroupName,
    onNewUpload
}: ProjectGalleryManagerProps) {
    const [newGalleryUrl, setNewGalleryUrl] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newItemUrls, setNewItemUrls] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingGroupId, setUploadingGroupId] = useState<string | null>(null);

    // Hooks
    const { upload } = useFirebaseUpload();

    const deleteMedia = useCallback(async (path: string) => {
        try {
            const res = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (e) {
            console.error("Delete failed", e);
            return false;
        }
    }, []);

    const handleAddUrl = () => {
        if (addGalleryItem(newGalleryUrl)) {
            setNewGalleryUrl('');
        }
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, groupId: string | null = null) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setUploadingGroupId(groupId);
            const { url, success, error } = await upload(file);

            if (!success) throw new Error(error);

            if (onNewUpload) onNewUpload(url);

            if (groupId) {
                addGalleryItemToGroup(groupId, url);
            } else {
                addGalleryItem(url);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Gagal mengunggah file. Silakan coba lagi.");
        } finally {
            setIsUploading(false);
            setUploadingGroupId(null);
            e.target.value = '';
        }
    };

    const handleRemoveItem = async (index: number) => {
        const item = formData.galleryItems[index];
        const storagePath = extractStoragePath(item.src);

        if (storagePath) {
            const confirmDelete = window.confirm(
                "Apakah Anda yakin ingin menghapus file ini?\n\nOK = Hapus permanen dari Firebase\nBatal = Tidak jadi menghapus"
            );
            if (confirmDelete) {
                const success = await deleteMedia(storagePath);
                if (!success) {
                    alert("Gagal menghapus file dari Firebase.");
                    return;
                }
            } else {
                return;
            }
        } else {
            if (!window.confirm("Hapus item ini dari galeri?")) return;
        }

        removeGalleryItem(index);
    };

    const handleRemoveItemFromGroup = async (groupId: string, itemIndex: number) => {
        const group = formData.galleryGroups.find(g => g.id === groupId);
        const item = group?.items[itemIndex];
        if (!item) return;

        const storagePath = extractStoragePath(item.src);

        if (storagePath) {
            const confirmDelete = window.confirm(
                "Apakah Anda yakin ingin menghapus file ini?\n\nOK = Hapus permanen dari Firebase\nBatal = Tidak jadi menghapus"
            );
            if (confirmDelete) {
                const success = await deleteMedia(storagePath);
                if (!success) {
                    alert("Gagal menghapus file dari Firebase.");
                    return;
                }
            } else {
                return;
            }
        } else {
            if (!window.confirm("Hapus item ini dari grup?")) return;
        }

        removeGalleryItemFromGroup(groupId, itemIndex);
    };

    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            addGalleryGroup(newGroupName.trim());
            setNewGroupName('');
        }
    };

    const handleAddItemToGroup = (groupId: string) => {
        const url = newItemUrls[groupId];
        if (addGalleryItemToGroup(groupId, url)) {
            setNewItemUrls(prev => ({ ...prev, [groupId]: '' }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Add New Group */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nama grup baru (misal: Dokumentasi, Proses, dll)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                />
                <button
                    type="button"
                    onClick={handleAddGroup}
                    disabled={!newGroupName.trim()}
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <FolderPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Grup Baru</span>
                </button>
            </div>

            {/* Default Gallery (Ungrouped Items) */}
            {formData.galleryItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Galeri Utama</h4>
                        <span className="text-xs text-gray-500">{formData.galleryItems.length} item</span>
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-4">
                        {formData.galleryItems.map((item, index) => (
                            <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group">
                                {item.kind === 'video' ? (
                                    <video src={item.src} className="w-full h-full object-cover" />
                                ) : (
                                    <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                                )}
                                {/* Status Indicator - Minimal dot */}
                                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400/70'}`} />

                                {/* Hover Actions - Clean inline buttons */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleGalleryItem(index); }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${item.isActive ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                        title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveItem(index); }}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition-all"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Item Row */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <input
                            type="text"
                            value={newGalleryUrl}
                            onChange={(e) => setNewGalleryUrl(e.target.value)}
                            placeholder="Tambah URL gambar/video..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                        />
                        <button
                            type="button"
                            onClick={handleAddUrl}
                            disabled={!newGalleryUrl.trim()}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <label className={`cursor-pointer px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5 ${isUploading && uploadingGroupId === null ? 'opacity-50' : ''}`}>
                            {isUploading && uploadingGroupId === null ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UploadCloud className="w-4 h-4" />
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={(e) => handleUploadFile(e, null)}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Gallery Groups */}
            <div className="space-y-4">
                {formData.galleryGroups.map((group) => (
                    <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-5">
                        {/* Group Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="text"
                                value={group.name}
                                onChange={(e) => updateGroupName(group.id, e.target.value)}
                                className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-400"
                                placeholder="Nama grup..."
                            />
                            <span className="text-xs text-gray-500">{group.items.length} item</span>
                            <button
                                type="button"
                                onClick={() => removeGalleryGroup(group.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                title="Hapus grup"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Items Grid */}
                        {group.items.length > 0 ? (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-4">
                                {group.items.map((item, index) => (
                                    <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group">
                                        {item.kind === 'video' ? (
                                            <video src={item.src} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                                        )}
                                        {/* Status Indicator - Minimal dot */}
                                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400/70'}`} />

                                        {/* Hover Actions - Clean inline buttons */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleGalleryItemInGroup(group.id, index); }}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${item.isActive ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {item.isActive ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveItemFromGroup(group.id, index); }}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 mb-4">
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs text-gray-400">Belum ada item</p>
                            </div>
                        )}

                        {/* Add Item Row */}
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <input
                                type="text"
                                value={newItemUrls[group.id] || ''}
                                onChange={(e) => setNewItemUrls(prev => ({ ...prev, [group.id]: e.target.value }))}
                                placeholder="Tambah URL gambar/video..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItemToGroup(group.id)}
                            />
                            <button
                                type="button"
                                onClick={() => handleAddItemToGroup(group.id)}
                                disabled={!newItemUrls[group.id]?.trim()}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <label className={`cursor-pointer px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5 ${isUploading && uploadingGroupId === group.id ? 'opacity-50' : ''}`}>
                                {isUploading && uploadingGroupId === group.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <UploadCloud className="w-4 h-4" />
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={(e) => handleUploadFile(e, group.id)}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>
                ))}

                {formData.galleryGroups.length === 0 && formData.galleryItems.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500 mb-1">Belum ada galeri</p>
                        <p className="text-xs text-gray-400">Tambahkan grup untuk mengelompokkan gambar/video</p>
                    </div>
                )}
            </div>
        </div>
    );
}
