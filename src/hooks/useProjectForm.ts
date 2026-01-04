import { useState, useEffect } from 'react';
import { Project, CreateProjectData, UpdateProjectData, GalleryItem } from '@/types/projects';
import { isVideoLink, detectImageDimensions } from '@/lib/media';

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
    tags: string;
    // external_link?: string; // Removed
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
    narrative: {
        challenge: string;
        solution: string;
        result: string;
    };
    comparison: {
        beforeImage: string;
        afterImage: string;
    };
}

export const useProjectForm = (project?: Project) => {
    const [formData, setFormData] = useState<ProjectFormData>({
        title: project?.title || '',
        client: project?.client || '',
        year: project?.year || new Date().getFullYear(),
        description: project?.description || '',
        cover: project?.cover || '',
        coverWidth: project?.coverWidth || 800,
        coverHeight: project?.coverHeight || 600,
        gallery: project?.gallery?.join('\n') || '',
        galleryItems: project?.galleryItems || (project?.gallery || []).map(url => ({
            kind: isVideoLink(url) ? 'video' : 'image',
            src: url,
            isActive: true
        })) as GalleryItem[],
        tags: project?.tags?.join(', ') || '',
        // external_link removed
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
        narrative: {
            challenge: project?.narrative?.challenge || '',
            solution: project?.narrative?.solution || '',
            result: project?.narrative?.result || ''
        },
        comparison: {
            beforeImage: project?.comparison?.beforeImage || '',
            afterImage: project?.comparison?.afterImage || ''
        }
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDetectingDimensions, setIsDetectingDimensions] = useState(false);

    useEffect(() => {
        setFormData({
            title: project?.title || '',
            client: project?.client || '',
            year: project?.year || new Date().getFullYear(),
            description: project?.description || '',
            cover: project?.cover || '',
            coverWidth: project?.coverWidth || 800,
            coverHeight: project?.coverHeight || 600,
            gallery: project?.gallery?.join('\n') || '',
            galleryItems: project?.galleryItems || (project?.gallery || []).map(url => ({
                kind: isVideoLink(url) ? 'video' : 'image',
                src: url,
                isActive: true
            })) as GalleryItem[],
            tags: project?.tags?.join(', ') || '',
            // external_link removed
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
            narrative: {
                challenge: project?.narrative?.challenge || '',
                solution: project?.narrative?.solution || '',
                result: project?.narrative?.result || ''
            },
            comparison: {
                beforeImage: project?.comparison?.beforeImage || '',
                afterImage: project?.comparison?.afterImage || ''
            }
        });
    }, [project]);

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
        else if (!formData.cover.startsWith('http')) newErrors.cover = 'Please enter a valid URL';

        return newErrors;
    };

    const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
        if (field === 'tags' && typeof value === 'string') {
            setFormData(prev => ({ ...prev, tags: value.toLowerCase() }));
        } else if (field === 'narrative') {
            setFormData(prev => ({ ...prev, narrative: { ...prev.narrative, ...(value as any) } }));
        } else if (field === 'comparison') {
            setFormData(prev => ({ ...prev, comparison: { ...prev.comparison, ...(value as any) } }));
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
            isActive: true
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

    const getSubmitData = (): CreateProjectData | UpdateProjectData | null => {
        const validationErrors = validateForm();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return null;

        return {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            gallery: formData.galleryItems.map(item => item.src),
            galleryItems: formData.galleryItems,
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
        getSubmitData
    };
};
