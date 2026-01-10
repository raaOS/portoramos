import { useState } from 'react';
import Image from 'next/image';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { CheckCircle2, X } from 'lucide-react';

interface ProjectGalleryManagerProps {
    formData: ProjectFormData;
    addGalleryItem: (url: string) => boolean;
    removeGalleryItem: (index: number) => void;
    toggleGalleryItem: (index: number) => void;
}

export default function ProjectGalleryManager({ formData, addGalleryItem, removeGalleryItem, toggleGalleryItem }: ProjectGalleryManagerProps) {
    const [newGalleryUrl, setNewGalleryUrl] = useState('');

    const handleAddUrl = () => {
        if (addGalleryItem(newGalleryUrl)) {
            setNewGalleryUrl('');
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Items
            </label>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Add image or video URL..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrl();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-none hover:bg-gray-200 text-sm font-medium"
                >
                    Add
                </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {formData.galleryItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-none border border-gray-200 group">
                        <div className="relative w-10 h-10 bg-gray-200 rounded-none overflow-hidden flex-shrink-0">
                            {item.kind === 'video' ? (
                                <video src={item.src} className="w-full h-full object-cover" />
                            ) : (
                                <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 truncate" title={item.src}>{item.src}</p>
                            <span className="text-[10px] uppercase font-bold text-gray-400">{item.kind}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => toggleGalleryItem(index)}
                                className={`p-1 rounded-none ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                title={item.isActive ? "Active" : "Hidden"}
                            >
                                <CheckCircle2 className="w-4 h-4 ml-auto" />
                            </button>
                            <button
                                type="button"
                                onClick={() => removeGalleryItem(index)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none"
                                title="Remove"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {formData.galleryItems.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4 italic">No gallery items yet</p>
                )}
            </div>
        </div>
    );
}
