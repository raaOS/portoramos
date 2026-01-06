export const isVideoLink = (url: string) => {
    if (!url) return false;
    return url.includes('/video/') ||
        url.endsWith('.mp4') ||
        url.endsWith('.mov') ||
        url.endsWith('.webm') ||
        url.includes('player.cloudinary.com');
};

export const detectImageDimensions = async (url: string): Promise<{ width: number; height: number }> => {
    if (!url || (!url.startsWith('http') && !url.startsWith('/'))) {
        throw new Error('Invalid URL');
    }

    // Check if it's a video URL
    if (isVideoLink(url)) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';

            const timeout = setTimeout(() => {
                reject(new Error('Video loading timeout'));
            }, 10000); // 10 second timeout

            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };

            video.onerror = (e) => {
                clearTimeout(timeout);
                console.warn('Video loading failed, trying fallback method:', e);
                // Fallback: try to extract dimensions from URL if it's Cloudinary
                if (url.includes('res.cloudinary.com')) {
                    // For Cloudinary videos, we can try to get dimensions from URL parameters
                    // or use default video dimensions
                    resolve({ width: 1080, height: 1920 }); // Common video ratio
                } else {
                    reject(new Error('Failed to load video'));
                }
            };

            video.src = url;
            video.load();
        });
    } else {
        // For images, use the browser Image constructor (client-side only)
        if (typeof window === 'undefined') {
            throw new Error('Window not defined');
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        return new Promise((resolve, reject) => {
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }
};
