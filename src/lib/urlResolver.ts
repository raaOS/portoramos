/**
 * Normalize media URLs used by the UI.
 * R2 uploads are served through `/r2/...`; local bundled assets use `/assets/...`.
 */
export function resolveStorageUrl(url: string): string {
    if (!url) return url;

    if (url.startsWith('r2/') || url.startsWith('assets/') || url.startsWith('temp/')) {
        return `/${url}`;
    }

    return url;
}

/**
 * Extract an R2 object key from a public media URL/path for deletion.
 */
export function extractStoragePath(url: string): string | null {
    if (!url) return null;

    try {
        if (url.startsWith('/r2/assets/') || url.startsWith('/r2/temp/')) {
            return url.substring('/r2/'.length);
        }

        if (url.startsWith('r2/assets/') || url.startsWith('r2/temp/')) {
            return url.substring('r2/'.length);
        }

        if (url.startsWith('/assets/') || url.startsWith('/temp/')) {
            return url.substring(1);
        }

        if (url.startsWith('assets/') || url.startsWith('temp/')) {
            return url;
        }

        const urlObj = new URL(url);
        const decodedPath = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));

        if (decodedPath.startsWith('r2/assets/') || decodedPath.startsWith('r2/temp/')) {
            return decodedPath.substring('r2/'.length);
        }

        if (decodedPath.startsWith('assets/') || decodedPath.startsWith('temp/')) {
            return decodedPath;
        }

        const assetsIndex = decodedPath.indexOf('assets/');
        if (assetsIndex >= 0) return decodedPath.slice(assetsIndex);

        const tempIndex = decodedPath.indexOf('temp/');
        if (tempIndex >= 0) return decodedPath.slice(tempIndex);

        return null;
    } catch {
        return null;
    }
}
