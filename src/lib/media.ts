export const isVideoLink = (url: string) => {
    if (!url) return false;
    
    // Remove query parameters or hash before checking the extension
    const urlWithoutQuery = url.split('?')[0].split('#')[0];
    
    return urlWithoutQuery.includes('/video/') ||
        urlWithoutQuery.endsWith('.mp4') ||
        urlWithoutQuery.endsWith('.mov') ||
        urlWithoutQuery.endsWith('.webm');
};

const getVideoDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.muted = true; // Helps with autoplay policies if needed
        video.playsInline = true;

        const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
        }, 10000);

        video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve({
                width: video.videoWidth,
                height: video.videoHeight
            });
            // Cleanup
            video.src = '';
            video.remove();
        };

        video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load video'));
        };

        video.src = url;
    });
};

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));

    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
};

export const detectImageDimensions = async (url: string): Promise<{ width: number; height: number }> => {
    if (!url || (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('blob:'))) {
        throw new Error('Invalid URL');
    }


    // Check if it's a video URL
    // Check explicit video link
    if (isVideoLink(url)) {
        return getVideoDimensions(url);
    }

    // Try Image first
    try {
        return await getImageDimensions(url);
    } catch (error) {
        // If Image fails and it's a blob (which has no extension), try Video
        if (url.startsWith('blob:')) {
            try {
                return await getVideoDimensions(url);
            } catch {
                throw new Error('Failed to load media (Image or Video detection failed)');
            }
        }
        throw error;
    }
};

/**
 * Extract path from URL (for deletion)
 * @param url - Full URL
 * @returns Path or null
 */
export function extractStoragePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // Format: https://storage.googleapis.com/BUCKET_NAME/PATH
        const parts = urlObj.pathname.split('/');
        if (parts.length < 2) return null;
        // Remove bucket name (first part)
        return parts.slice(2).join('/');
    } catch {
        return null;
    }
}


