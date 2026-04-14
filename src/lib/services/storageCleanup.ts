import { extractStoragePath } from '@/lib/urlResolver';
import { bucket } from '@/lib/firebaseAdmin';

/**
 * Safely delete a Firebase Storage asset by its public URL.
 * Extracts the storage path from the URL and verifies existence before deletion.
 * 
 * @param url - The public URL of the Firebase Storage asset
 * @param label - Optional label for logging (e.g. 'HardSkillService')
 */
export async function deleteStorageAsset(url: string, label = 'StorageCleanup'): Promise<void> {
    if (!url) return;

    try {
        const storagePath = extractStoragePath(url);
        if (storagePath && storagePath.startsWith('assets/')) {
            const file = bucket.file(storagePath);
            const [exists] = await file.exists();
            if (exists) await file.delete();
        }
    } catch (e) {
        console.warn(`[${label}] Failed to cleanup storage asset: ${url}`, e);
    }
}

/**
 * Batch delete multiple Firebase Storage assets by their public URLs.
 * Uses Promise.allSettled so individual failures don't block others.
 * 
 * @param urls - Array of public URLs to delete
 * @param label - Optional label for logging
 */
export async function deleteStorageAssets(urls: string[], label = 'StorageCleanup'): Promise<void> {
    if (urls.length === 0) return;

    await Promise.allSettled(
        urls.map(url => deleteStorageAsset(url, label))
    );
}
