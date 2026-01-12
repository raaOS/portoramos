export const isVideoLink = (url: string) => {
    if (!url) return false;
    return url.includes('/video/') ||
        url.endsWith('.mp4') ||
        url.endsWith('.mov') ||
        url.endsWith('.webm') ||
        // If it's a blob and we don't know the type, we might need more robust checking, 
        // but often we rely on the component knowing. 
        // For now, let's allow the detection function to try both.
        false;
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
            } catch (videoError) {
                throw new Error('Failed to load media (Image or Video detection failed)');
            }
        }
        throw error;
    }
};


