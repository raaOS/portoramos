/**
 * Unified URL Resolver for Firebase Storage
 * 
 * Single source of truth for all URL transformations related to Firebase Storage.
 * Consolidates duplicated logic from:
 *   - lib/images.ts (convertGcsUrl)
 *   - lib/utils.ts (getProxiedUrl)
 *   - api/projects/route.ts (convertGcsUrls)
 *   - lib/media.ts (extractStoragePath)
 */

// Regex to match GCS URLs: https://storage.googleapis.com/<bucket>/<path>
const GCS_URL_PATTERN = /^https?:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/;

/**
 * Convert a GCS or Firebase Storage URL to the publicly accessible
 * `firebasestorage.googleapis.com` format.
 * 
 * Handles:
 * - `storage.googleapis.com/<bucket>/<path>` → Firebase Storage proxy URL
 * - Already-correct `firebasestorage.googleapis.com` URLs → returned as-is
 * - Non-matching URLs → returned as-is
 * 
 * @param url - The URL to resolve
 * @param prefixAssets - If true, auto-prefixes `assets/` if path doesn't start with it (default: true)
 * @returns The resolved URL
 */
export function resolveStorageUrl(url: string, prefixAssets = true): string {
    if (!url) return url;

    // Already in correct format
    if (url.includes('firebasestorage.googleapis.com')) {
        return url;
    }

    const match = url.match(GCS_URL_PATTERN);
    if (match) {
        const bucket = match[1];
        let path = match[2];
        if (prefixAssets && !path.startsWith('assets/')) {
            path = `assets/${path}`;
        }
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }

    return url;
}

/**
 * Build a Firebase Storage public URL from a bucket name and storage path.
 * 
 * @param bucketName - The storage bucket name (e.g. `my-project.appspot.com`)
 * @param storagePath - The path within the bucket (e.g. `assets/projects/image.webp`)
 * @returns The full public URL
 */
export function buildStorageUrl(bucketName: string, storagePath: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
}

/**
 * Extract the storage path from a Firebase Storage URL for deletion/reference.
 * 
 * Handles both formats:
 * - `firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-path>?alt=media`
 * - `storage.googleapis.com/<bucket>/<path>`
 * 
 * @param url - The full URL
 * @returns The storage path, or null if the URL doesn't match
 */
export function extractStoragePath(url: string): string | null {
    if (!url) return null;

    try {
        // Format 1: firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-path>?alt=media
        if (url.includes('firebasestorage.googleapis.com')) {
            const pathPart = url.split('/o/')[1];
            if (!pathPart) return null;
            return decodeURIComponent(pathPart.split('?')[0]);
        }

        // Format 2: storage.googleapis.com/<bucket>/<path>
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/');
        if (parts.length < 3) return null;
        // Remove empty first element and bucket name
        return parts.slice(2).join('/');
    } catch {
        return null;
    }
}

/**
 * Check if a URL is a Firebase Storage URL.
 */
export function isFirebaseStorageUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('firebasestorage.googleapis.com') || 
           url.includes('storage.googleapis.com');
}
