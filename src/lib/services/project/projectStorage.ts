import { bucket } from '@/lib/firebaseAdmin';
import type { Project } from '@/types/projects';

export function extractProjectAssets(project: Project): string[] {
    const assetUrls: string[] = [];
    if (project.cover) assetUrls.push(project.cover);
    if (project.comparison?.beforeImage) assetUrls.push(project.comparison.beforeImage);
    if (project.comparison?.afterImage) assetUrls.push(project.comparison.afterImage);
    
    if (project.galleryItems && Array.isArray(project.galleryItems)) {
        project.galleryItems.forEach((item: { src?: string }) => {
            if (item.src) assetUrls.push(item.src);
        });
    }
    
    if (project.galleryGroups && Array.isArray(project.galleryGroups)) {
        project.galleryGroups.forEach((group: { items?: Array<{ src?: string }> }) => {
            group.items?.forEach(item => {
                if (item.src) assetUrls.push(item.src);
            });
        });
    }
    
    return assetUrls;
}

export async function purgeStorageAssets(urls: string[]): Promise<void> {
    const allAssetPathsToPurge: string[] = [];

    urls.forEach(url => {
        let storagePath = '';
        if (url.includes('/o/')) {
            const parts = url.split('/o/');
            storagePath = decodeURIComponent(parts[1].split('?')[0]);
        } else if (url.startsWith('/')) {
            storagePath = url.substring(1);
        }
        
        if (storagePath && storagePath.startsWith('assets/')) {
            allAssetPathsToPurge.push(storagePath);
        }
    });

    if (allAssetPathsToPurge.length > 0) {
        console.log(`[ProjectService] Bulk purging ${allAssetPathsToPurge.length} storage assets...`);
        await Promise.allSettled(allAssetPathsToPurge.map(async (storagePath) => {
            try {
                const file = bucket.file(storagePath);
                const [exists] = await file.exists();
                if (exists) await file.delete();
            } catch (e) {
                console.warn(`[ProjectService] Failed bulk delete asset: ${storagePath}`, e);
            }
        }));
    }
}
