import { useState } from 'react';
import Image from 'next/image';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { CheckCircle2, X, Plus, FolderPlus, Trash2, Image as ImageIcon, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { uploadToGitHub, deleteFromGitHub, getGithubPathFromUrl } from '@/lib/githubUpload';

interface ProjectGalleryManagerProps {
    formData: ProjectFormData;
    addGalleryItem: (url: string, githubPath?: string) => boolean;
    removeGalleryItem: (index: number) => void;
    toggleGalleryItem: (index: number) => void;
    addGalleryGroup: (name: string) => void;
    removeGalleryGroup: (groupId: string) => void;
    addGalleryItemToGroup: (groupId: string, url: string, githubPath?: string) => boolean;
    removeGalleryItemFromGroup: (groupId: string, itemIndex: number) => void;
    toggleGalleryItemInGroup: (groupId: string, itemIndex: number) => void;
    updateGroupName: (groupId: string, name: string) => void;
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
    updateGroupName
}: ProjectGalleryManagerProps) {
    const [newGalleryUrl, setNewGalleryUrl] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newItemUrls, setNewItemUrls] = useState<Record<string, string>>({});

    // Upload States
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingGroupId, setUploadingGroupId] = useState<string | null>(null);

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
            const { url, githubPath } = await uploadToGitHub(file);

            if (groupId) {
                addGalleryItemToGroup(groupId, url, githubPath);
            } else {
                addGalleryItem(url, githubPath);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Gagal mengunggah file. Silakan coba lagi.");
        } finally {
            setIsUploading(false);
            setUploadingGroupId(null);
            e.target.value = ''; // Reset input
        }
    };

    const handleRemoveItem = async (index: number) => {
        const item = formData.galleryItems[index];
        // Try to get githubPath from item or infer from URL
        const githubPath = item.githubPath || getGithubPathFromUrl(item.src);

        if (githubPath) {
            const confirmDelete = window.confirm(
                "Apakah Anda juga ingin menghapus file ini PERMANEN dari GitHub?\n\n" +
                "⚠️ PERHATIAN: Ini akan menghapus file asli di repositori.\n\n" +
                "Klik OK untuk hapus permanen (bersihkan GitHub).\n" +
                "Klik Batal untuk hanya menghapus dari galeri saja."
            );

            if (confirmDelete) {
                const success = await deleteFromGitHub(githubPath);
                if (!success) {
                    alert("Gagal menghapus file dari GitHub. Item akan dihapus dari form.");
                } else {
                    console.log(`Successfully deleted ${githubPath} from GitHub`);
                }
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

        const githubPath = item.githubPath || getGithubPathFromUrl(item.src);

        if (githubPath) {
            const confirmDelete = window.confirm(
                "Apakah Anda juga ingin menghapus file ini PERMANEN dari GitHub?\n\n" +
                "⚠️ PERHATIAN: Ini akan menghapus file asli di repositori.\n\n" +
                "Klik OK untuk hapus permanen (bersihkan GitHub).\n" +
                "Klik Batal untuk hanya menghapus dari galeri saja."
            );

            if (confirmDelete) {
                const success = await deleteFromGitHub(githubPath);
                if (!success) {
                    alert("Gagal menghapus file dari GitHub. Item akan dihapus dari form.");
                }
            }
        } else {
            if (!window.confirm("Hapus item ini dari kelompok galeri?")) return;
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
        <div className="space-y-8">
            {/* Standard Gallery (Legacy Support) */}
            <div className="p-4 bg-gray-50 border border-gray-200">
                <label className="block text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">
                    Galeri Utama (Default)
                </label>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        placeholder="Tambah URL gambar/video ke galeri utama..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                        type="button"
                        onClick={handleAddUrl}
                        title="Tambah via Link"
                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-zinc-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <label
                        className={`cursor-pointer px-4 py-2 bg-purple-600 text-white text-xs font-bold uppercase hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 ${isUploading && uploadingGroupId === null ? 'opacity-50 cursor-wait' : ''}`}
                        title="Upload dari Komputer (PC)"
                    >
                        {isUploading && uploadingGroupId === null ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span className="hidden sm:inline">Upload PC</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={(e) => handleUploadFile(e, null)}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {formData.galleryItems.map((item, index) => (
                        <div key={index} className="relative aspect-square bg-gray-200 group border border-gray-100">
                            {item.kind === 'video' ? (
                                <video src={item.src} className="w-full h-full object-cover" />
                            ) : (
                                <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleGalleryItem(index)}
                                    className={`p-1.5 rounded-full ${item.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-1.5 bg-red-500 text-white rounded-full"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gallery Groups */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider">
                        Kelompok Galeri (Gallery Grouping)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Nama Kelompok (misal: Dokumentasi)"
                            className="px-3 py-1.5 border border-gray-300 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <button
                            type="button"
                            onClick={handleAddGroup}
                            className="px-3 py-1.5 bg-zinc-100 text-zinc-900 border border-zinc-200 text-[10px] font-bold uppercase hover:bg-zinc-200 flex items-center gap-1.5"
                        >
                            <FolderPlus className="w-3 h-3" /> Group Baru
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {formData.galleryGroups.map((group) => (
                        <div key={group.id} className="border border-zinc-200 p-4 bg-white shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={group.name}
                                        onChange={(e) => updateGroupName(group.id, e.target.value)}
                                        className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0 w-full"
                                        placeholder="Nama Kelompok..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeGalleryGroup(group.id)}
                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newItemUrls[group.id] || ''}
                                    onChange={(e) => setNewItemUrls(prev => ({ ...prev, [group.id]: e.target.value }))}
                                    placeholder="URL gambar/video untuk kelompok ini..."
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-black"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddItemToGroup(group.id)}
                                    title="Tambah via Link"
                                    className="px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase"
                                >
                                    Tambah
                                </button>
                                <label
                                    className={`cursor-pointer px-3 py-1.5 bg-purple-600 text-white text-[10px] font-bold uppercase hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 ${isUploading && uploadingGroupId === group.id ? 'opacity-50 cursor-wait' : ''}`}
                                    title="Upload dari Komputer (PC)"
                                >
                                    {isUploading && uploadingGroupId === group.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                    <span className="hidden sm:inline">Upload PC</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={(e) => handleUploadFile(e, group.id)}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {group.items.map((item, index) => (
                                    <div key={index} className="relative aspect-square bg-gray-100 group overflow-hidden border border-gray-200">
                                        {item.kind === 'video' ? (
                                            <video src={item.src} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                            <div className="flex gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGalleryItemInGroup(group.id, index)}
                                                    className={`p-1 rounded-full ${item.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItemFromGroup(group.id, index)}
                                                    className="p-1 bg-red-500 text-white rounded-full"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="text-[8px] text-white font-bold uppercase tracking-widest">{item.kind}</span>
                                        </div>
                                    </div>
                                ))}
                                {group.items.length === 0 && (
                                    <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-none flex flex-col items-center justify-center text-gray-300">
                                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Kosong</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {formData.galleryGroups.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-none bg-gray-50/50">
                            <p className="text-sm text-gray-400 italic">Belum ada kelompok galeri. Jika project Anda kompleks, tambahkan kelompok untuk mengelompokkan aset.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
