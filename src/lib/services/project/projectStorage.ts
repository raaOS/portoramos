import { deleteFromR2, isR2StorageConfigured } from '@/lib/r2Storage';
import { extractStoragePath } from '@/lib/urlResolver';
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
        const storagePath = extractStoragePath(url);
        
        if (storagePath && storagePath.startsWith('assets/')) {
            allAssetPathsToPurge.push(storagePath);
        }
    });

    if (allAssetPathsToPurge.length > 0) {
        console.log(`[ProjectService] Bulk purging ${allAssetPathsToPurge.length} storage assets...`);
        await Promise.allSettled(allAssetPathsToPurge.map(async (storagePath) => {
            try {
                await deleteFromR2IfConfigured(storagePath);
            } catch (e) {
                console.warn(`[ProjectService] Failed bulk delete asset: ${storagePath}`, e);
            }
        }));
    }
}

async function deleteFromR2IfConfigured(storagePath: string) {
    if (!isR2StorageConfigured()) return;
    await deleteFromR2(storagePath);
}
