import { useState, useEffect } from 'react';
import { Project, CreateProjectData, UpdateProjectData, GalleryItem, GalleryGroup } from '@/types/projects';
import { isVideoLink, detectImageDimensions } from '@/lib/media';
import { Comment } from '@/lib/magic';

export interface ProjectFormData {
    title: string;
    client: string;
    year: number;
    description: string;
    cover: string;
    coverWidth: number;
    coverHeight: number;
    gallery: string;
    galleryItems: GalleryItem[];
    galleryGroups: GalleryGroup[];
    tags: string;
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    playsInline: boolean;
    id?: string;
    slug?: string;
    likes?: number;
    shares?: number;
    allowComments?: boolean;
    initialCommentCount?: number;
    // Case Study Fields
    role?: string;
    timeline?: string;
    team?: string;
    software?: string[];
    type?: 'commercial' | 'visual_art';
    narrative: {
        // Commercial
        context?: string;
        challenge?: string;
        solution?: string;
        impact?: string;
        result?: string; // Legacy

        // Visual Art
        concept?: string;
        process?: string;
        detail?: string;
    };
    comparison: {
        beforeImage: string;
        beforeType: 'image' | 'video';
        afterImage: string;
        afterType: 'image' | 'video';
    };
    comments?: Comment[];
}

/**
 * Factory function to create initial form data from a project.
 * Eliminates the previous duplication between useState init and useEffect sync.
 */
function createInitialFormData(project?: Project): ProjectFormData {
    return {
        title: project?.title || '',
        client: project?.client || '',
        year: project?.year || new Date().getFullYear(),
        description: project?.description || '',
        cover: project?.cover || '',
        coverWidth: project?.coverWidth || 800,
        coverHeight: project?.coverHeight || 600,
        gallery: '',
        galleryItems: [],
        galleryGroups: project?.galleryGroups || [],
        tags: project?.tags?.join(', ') || '',
        autoplay: project?.autoplay ?? true,
        muted: project?.muted ?? true,
        loop: project?.loop ?? true,
        playsInline: project?.playsInline ?? true,
        id: project?.id,
        slug: project?.slug,
        likes: project?.likes ?? 0,
        shares: project?.shares ?? 0,
        allowComments: project?.allowComments ?? true,
        initialCommentCount: 2,

        // Case Study Fields
        role: project?.role || '',
        timeline: project?.timeline || '',
        team: project?.team || '',
        software: project?.software || [],
        type: project?.type || 'commercial',

        narrative: {
            context: project?.narrative?.context || '',
            challenge: project?.narrative?.challenge || '',
            solution: project?.narrative?.solution || '',
            impact: project?.narrative?.impact || '',
            result: project?.narrative?.result || '',
            concept: project?.narrative?.concept || '',
            process: project?.narrative?.process || '',
            detail: project?.narrative?.detail || ''
        },
        comparison: {
            beforeImage: project?.comparison?.beforeImage || '',
            beforeType: project?.comparison?.beforeType || 'image',
            afterImage: project?.comparison?.afterImage || '',
            afterType: project?.comparison?.afterType || 'image'
        }
    };
}

export const useProjectForm = (project?: Project) => {
    const [formData, setFormData] = useState<ProjectFormData>(() => createInitialFormData(project));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDetectingDimensions, setIsDetectingDimensions] = useState(false);

    // Re-sync form data when the project prop changes (Sync during render for better purity)
    const [prevProjectMeta, setPrevProjectMeta] = useState({ id: project?.id, updatedAt: project?.updatedAt });
    if (project?.id !== prevProjectMeta.id || project?.updatedAt !== prevProjectMeta.updatedAt) {
        setPrevProjectMeta({ id: project?.id, updatedAt: project?.updatedAt });
        if (project) {
            setFormData(createInitialFormData(project));
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        else if (formData.title.length < 2) newErrors.title = 'Title must be at least 2 characters';

        if (!formData.client.trim()) newErrors.client = 'Client is required';

        if (!formData.year || formData.year < 2000 || formData.year > new Date().getFullYear() + 1) {
            newErrors.year = 'Year must be between 2000 and ' + (new Date().getFullYear() + 1);
        }

        if (!formData.description.trim()) newErrors.description = 'Description is required';
        else if (formData.description.length < 5) newErrors.description = 'Description must be at least 5 characters';

        if (!formData.cover.trim()) newErrors.cover = 'Cover image/video URL is required';
        else if (!formData.cover.startsWith('http') && !formData.cover.startsWith('/') && !formData.cover.startsWith('blob:')) newErrors.cover = 'Please enter a valid URL';

        return newErrors;
    };

    const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
        if (field === 'tags' && typeof value === 'string') {
            setFormData(prev => ({ ...prev, tags: value.toLowerCase() }));
        } else if (field === 'narrative') {
            setFormData(prev => ({ ...prev, narrative: { ...prev.narrative, ...(value as Record<string, string>) } }));
        } else if (field === 'comparison') {
            setFormData(prev => ({ ...prev, comparison: { ...prev.comparison, ...(value as Record<string, string>) } }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }

        if (typeof field === 'string' && errors[field as string]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[field as string];
                return newErrs;
            });
        }

        if (field === 'cover' && typeof value === 'string') {
            handleDetectDimensions(value);
        }
    };

    const handleDetectDimensions = async (url: string) => {
        try {
            setIsDetectingDimensions(true);
            const dims = await detectImageDimensions(url);
            setFormData(prev => ({
                ...prev,
                coverWidth: dims.width,
                coverHeight: dims.height
            }));
        } catch (error) {
            console.error('Error detecting media dimensions:', error);
        } finally {
            setIsDetectingDimensions(false);
        }
    };

    const addGalleryItem = (url: string) => {
        const cleanUrl = url.trim();
        if (!cleanUrl) return false;
        if (formData.galleryItems.some(item => item.src === cleanUrl)) return false;

        const newItem: GalleryItem = {
            kind: isVideoLink(cleanUrl) ? 'video' : 'image',
            src: cleanUrl,
            isActive: true,
        };

        setFormData(prev => ({
            ...prev,
            galleryItems: [...prev.galleryItems, newItem]
        }));
        return true;
    };

    const removeGalleryItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            galleryItems: prev.galleryItems.filter((_, i) => i !== index)
        }));
    };

    const toggleGalleryItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            galleryItems: prev.galleryItems.map((item, i) =>
                i === index ? { ...item, isActive: !item.isActive } : item
            )
        }));
    };

    const addGalleryGroup = (name: string) => {
        const newGroup: GalleryGroup = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            items: []
        };
        setFormData(prev => ({
            ...prev,
            galleryGroups: [...prev.galleryGroups, newGroup]
        }));
    };

    const removeGalleryGroup = (groupId: string) => {
        setFormData(prev => ({
            ...prev,
            galleryGroups: prev.galleryGroups.filter(g => g.id !== groupId)
        }));
    };

    const addGalleryItemToGroup = (groupId: string, url: string) => {
        const cleanUrl = url.trim();
        if (!cleanUrl) return false;

        const newItem: GalleryItem = {
            kind: isVideoLink(cleanUrl) ? 'video' : 'image',
            src: cleanUrl,
            isActive: true,
        };

        setFormData(prev => ({
            ...prev,
            galleryGroups: prev.galleryGroups.map(group =>
                group.id === groupId
                    ? { ...group, items: [...group.items, newItem] }
                    : group
            )
        }));
        return true;
    };

    const removeGalleryItemFromGroup = (groupId: string, itemIndex: number) => {
        setFormData(prev => ({
            ...prev,
            galleryGroups: prev.galleryGroups.map(group =>
                group.id === groupId
                    ? { ...group, items: group.items.filter((_: GalleryItem, i: number) => i !== itemIndex) }
                    : group
            )
        }));
    };

    const toggleGalleryItemInGroup = (groupId: string, itemIndex: number) => {
        setFormData(prev => ({
            ...prev,
            galleryGroups: prev.galleryGroups.map(group =>
                group.id === groupId
                    ? {
                        ...group,
                        items: group.items.map((item: GalleryItem, i: number) =>
                            i === itemIndex ? { ...item, isActive: !item.isActive } : item
                        )
                    }
                    : group
            )
        }));
    };

    const updateGroupName = (groupId: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            galleryGroups: prev.galleryGroups.map(group =>
                group.id === groupId ? { ...group, name } : group
            )
        }));
    };

    const getSubmitData = (): CreateProjectData | UpdateProjectData | null => {
        const validationErrors = validateForm();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return null;

        return {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            gallery: formData.galleryItems.map(item => item.src),
            galleryItems: formData.galleryItems,
            galleryGroups: formData.galleryGroups,
            narrative: formData.narrative,
            comparison: formData.comparison.beforeImage ? formData.comparison : undefined,
            ...(project && { id: project.id })
        };
    };

    return {
        formData,
        errors,
        isDetectingDimensions,
        updateField,
        addGalleryItem,
        removeGalleryItem,
        toggleGalleryItem,
        addGalleryGroup,
        removeGalleryGroup,
        addGalleryItemToGroup,
        removeGalleryItemFromGroup,
        toggleGalleryItemInGroup,
        updateGroupName,
        getSubmitData
    };
};
