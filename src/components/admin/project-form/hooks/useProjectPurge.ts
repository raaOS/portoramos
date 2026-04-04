import { useState } from 'react';
import { CreateProjectData, Project } from '@/types/projects';

export function useProjectPurge(project?: Project) {
    const [sessionUploads, setSessionUploads] = useState<string[]>([]);

    const trackNewUpload = (url: string) => {
        setSessionUploads(prev => [...prev, url]);
    };

    const extractStoragePath = (url: string) => {
        try {
            const p = url.split('/o/');
            return p[1] ? decodeURIComponent(p[1].split('?')[0]) : null;
        } catch { return null; }
    };

    const purgeUrl = async (url: string) => {
        try {
            const path = extractStoragePath(url);
            if (path && !url.startsWith('blob:')) {
                await fetch(`/api/upload?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
            }
        } catch (e) {
            console.error("Purge failed for", url, e);
        }
    };

    const getAllUrls = (data: Partial<CreateProjectData>) => {
        const urls = new Set<string>();
        if (data.cover) urls.add(data.cover);
        if (data.comparison?.beforeImage) urls.add(data.comparison.beforeImage);
        if (data.comparison?.afterImage) urls.add(data.comparison.afterImage);
        data.galleryItems?.forEach(item => urls.add(item.src));
        data.galleryGroups?.forEach(g => g.items.forEach(item => urls.add(item.src)));
        return urls;
    };

    const executeCleanup = async (submitData: Partial<CreateProjectData>) => {
        const usedUrls = getAllUrls(submitData);
        const originalUrls = project ? getAllUrls(project as unknown as CreateProjectData) : new Set<string>();

        // 1. Ghost session uploads (uploaded in this session, but replaced/removed before submit)
        const ghostSessionUrls = sessionUploads.filter(url => !usedUrls.has(url));
        // 2. Removed original uploads (existed before, removed during edit)
        const removedOriginalUrls = Array.from(originalUrls).filter(url => !usedUrls.has(url));

        const urlsToPurge = [...ghostSessionUrls, ...removedOriginalUrls];
        
        if (urlsToPurge.length > 0) {
            // Fire and forget (don't await individual deletes to speed up UI)
            urlsToPurge.forEach(purgeUrl);
        }
    };

    const handleCancelCleanup = async () => {
        if (sessionUploads.length > 0) {
            const confirm = window.confirm(
                "Membatalkan form akan MENGHAPUS file media baru yang sudah Anda upload di sesi ini. Lanjutkan?"
            );
            if (!confirm) return false;

            sessionUploads.forEach(purgeUrl);
        }
        return true;
    };

    return { trackNewUpload, executeCleanup, handleCancelCleanup };
}
