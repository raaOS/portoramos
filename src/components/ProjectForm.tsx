'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Project, CreateProjectData, UpdateProjectData, GalleryItem } from '@/types/projects';
import { isVideoLink } from '@/lib/media';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import AdminModal from '@/app/admin/components/AdminModal';
import AdminButton from '@/app/admin/components/AdminButton';
import { useProjectForm } from '@/hooks/useProjectForm';

// Project Form Component
interface ProjectFormProps {
    project?: Project;
    onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
    onCancel: () => void;
    title: string;
}

export default function ProjectForm({ project, onSubmit, onCancel, title }: ProjectFormProps) {
    const {
        formData,
        errors,
        isDetectingDimensions,
        updateField,
        addGalleryItem,
        removeGalleryItem,
        toggleGalleryItem,
        getSubmitData
    } = useProjectForm(project);

    // Local state for the gallery input
    const [newGalleryUrl, setNewGalleryUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = getSubmitData();
        if (submitData) {
            await onSubmit(submitData);
        }
    };

    const handleButtonClick = () => {
        // Create a synthetic event for handleSubmit
        const syntheticEvent = {
            preventDefault: () => { },
        } as React.FormEvent;
        handleSubmit(syntheticEvent);
    };

    const handleAddUrl = () => {
        if (addGalleryItem(newGalleryUrl)) {
            setNewGalleryUrl('');
        }
    };

    // AI Generation Logic
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDescription = async () => {
        const imageUrl = formData.cover || (formData.galleryItems.length > 0 ? formData.galleryItems[0].src : null);

        if (!imageUrl) {
            alert('Please provide a Cover URL or add a Gallery item first.');
            return;
        }

        if (!imageUrl.startsWith('http')) {
            alert('Please use a valid http/https URL.');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate description');
            }

            updateField('description', data.description);
        } catch (error: any) {
            alert(error.message || 'Error generating description');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AdminModal
            isOpen={true}
            onClose={onCancel}
            title={title}
            size="lg"
            actions={
                <div className="flex space-x-3">
                    <AdminButton variant="secondary" onClick={onCancel}>
                        Cancel
                    </AdminButton>
                    <AdminButton
                        onClick={handleButtonClick}
                    >
                        {project ? 'Update Project' : 'Create Project'}
                    </AdminButton>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.title ? 'border-red-300 ring-red-200' : 'border-gray-300'
                                }`}
                            placeholder="Project title"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client *
                        </label>
                        <input
                            type="text"
                            value={formData.client}
                            onChange={(e) => updateField('client', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.client ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Client name"
                        />
                        {errors.client && (
                            <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year *
                        </label>
                        <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => updateField('year', parseInt(e.target.value) || new Date().getFullYear())}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.year ? 'border-red-300' : 'border-gray-300'
                                }`}
                            min="2000"
                            max={new Date().getFullYear() + 1}
                        />
                        {errors.year && (
                            <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => updateField('tags', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="React, Next.js, TypeScript (comma separated)"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Description *
                        </label>
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={isGenerating}
                            className="text-xs flex items-center gap-1.5 px-2 py-1 bg-violet-50 text-violet-600 rounded hover:bg-violet-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate description from Cover Image"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">✨</span>
                                    AI Generate
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Project description (or use AI Generate to fill this)"
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cover Image/Video URL *
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formData.cover}
                            onChange={(e) => updateField('cover', e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.cover ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="https://..."
                        />
                        {isDetectingDimensions && (
                            <div className="flex items-center px-2 text-violet-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.cover && (
                        <p className="mt-1 text-sm text-red-600">{errors.cover}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Cover Width</label>
                        <input
                            type="number"
                            value={formData.coverWidth}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Cover Height</label>
                        <input
                            type="number"
                            value={formData.coverHeight}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm"
                        />
                    </div>
                </div>

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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                        >
                            Add
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {formData.galleryItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 group">
                                <div className="relative w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
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
                                        className={`p-1 rounded ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                        title={item.isActive ? "Active" : "Hidden"}
                                    >
                                        <CheckCircle2 className="w-4 h-4 ml-auto" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryItem(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        External Link
                    </label>
                    <input
                        type="text"
                        value={formData.external_link}
                        onChange={(e) => updateField('external_link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="https://example.com"
                    />
                </div>
            </form>
        </AdminModal>
    );
}
