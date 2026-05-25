import { extractStoragePath } from '@/lib/urlResolver';
import { deleteFromR2, isR2StorageConfigured } from '@/lib/r2Storage';

/**
 * Safely delete a Storage asset by its public URL.
 * Extracts the storage path from the URL and verifies existence before deletion.
 *
 * @param url - The public URL of the Storage asset
 * @param label - Optional label for logging (e.g. 'HardSkillService')
 */
export async function deleteStorageAsset(url: string, label = 'StorageCleanup'): Promise<void> {
  if (!url) return;

  try {
    const storagePath = extractStoragePath(url);
    if (storagePath && storagePath.startsWith('assets/')) {
      await deleteFromR2IfConfigured(storagePath);
    }
  } catch (e) {
    console.warn(`[${label}] Failed to cleanup storage asset: ${url}`, e);
  }
}

async function deleteFromR2IfConfigured(storagePath: string) {
  if (!isR2StorageConfigured()) return;
  await deleteFromR2(storagePath);
}

/**
 * Batch delete multiple storage assets by their public URLs.
 * Uses Promise.allSettled so individual failures don't block others.
 *
 * @param urls - Array of public URLs to delete
 * @param label - Optional label for logging
 */
export async function deleteStorageAssets(urls: string[], label = 'StorageCleanup'): Promise<void> {
  if (urls.length === 0) return;

  await Promise.allSettled(urls.map((url) => deleteStorageAsset(url, label)));
}
