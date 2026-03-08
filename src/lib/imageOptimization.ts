/**
 * Image Optimization Utilities untuk Firebase Storage
 * 
 * Mengurangi bandwidth dengan:
 * 1. Generate resized image URL (Firebase Storage tidak support on-the-fly resize)
 * 2. Lazy loading dengan Intersection Observer
 * 3. WebP format detection
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

interface ImageDimensions {
    width: number;
    height?: number;
    quality?: number;
}

const SIZE_CONFIG: Record<ImageSize, ImageDimensions> = {
    thumbnail: { width: 150, quality: 60 },
    small: { width: 400, quality: 70 },
    medium: { width: 800, quality: 80 },
    large: { width: 1200, quality: 85 },
    original: { width: 0, quality: 90 }, // 0 = original size
};

/**
 * Generate optimized image URL.
 * 
 * NOTE: Firebase Storage tidak mendukung on-the-fly resize seperti Cloudinary.
 * Untuk truly optimized images, gunakan Firebase Extension "Resize Images" atau
 * upload multiple sizes saat upload.
 * 
 * Sementara ini function mengembalikan URL asli dengan cache headers.
 */
export function getOptimizedImageUrl(
    url: string,
    _size: ImageSize = 'medium'
): string {
    if (!url || url.startsWith('data:')) return url;
    
    // Jika sudah ada size parameter (dari Firebase Resize Extension), gunakan itu
    if (url.includes('_thumb.') || url.includes('_medium.')) {
        return url;
    }
    
    // Untuk Firebase Storage, kita bisa tambahkan alt=media untuk direct download
    // dan memastikan caching bekerja dengan baik
    // const separator = url.includes('?') ? '&' : '?';
    
    // Add cache-busting version untuk cache control
    // Firebase Storage sudah mendukung Cache-Control headers
    return url;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
}

/**
 * Generate srcset untuk responsive images
 * 
 * NOTE: Ini hanya berfungsi jika Anda sudah upload multiple sizes ke Firebase Storage
 * menggunakan Firebase Extension "Resize Images" atau manual.
 */
export function generateSrcSet(
    baseUrl: string,
    sizes: ImageSize[] = ['small', 'medium', 'large']
): string {
    if (!baseUrl || baseUrl.startsWith('data:')) return '';
    
    // Jika menggunakan Firebase Resize Extension, URL akan seperti:
    // baseUrl: https://.../image.jpg
    // thumb: https://.../image_thumb.jpg
    // medium: https://.../image_medium.jpg
    
    const srcSetEntries = sizes.map(size => {
        const config = SIZE_CONFIG[size];
        const sizeUrl = getSizeUrl(baseUrl, size);
        return `${sizeUrl} ${config.width}w`;
    });
    
    return srcSetEntries.join(', ');
}

function getSizeUrl(baseUrl: string, size: ImageSize): string {
    if (size === 'original') return baseUrl;
    
    // Insert size suffix before file extension
    // Example: image.jpg -> image_thumb.jpg
    const lastDot = baseUrl.lastIndexOf('.');
    if (lastDot === -1) return baseUrl;
    
    const suffix = size === 'thumbnail' ? '_thumb' : `_${size}`;
    return baseUrl.slice(0, lastDot) + suffix + baseUrl.slice(lastDot);
}

/**
 * Determine optimal image size berdasarkan container width
 */
export function getOptimalSize(containerWidth: number): ImageSize {
    if (containerWidth <= 150) return 'thumbnail';
    if (containerWidth <= 400) return 'small';
    if (containerWidth <= 800) return 'medium';
    if (containerWidth <= 1200) return 'large';
    return 'original';
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Batch preload images dengan priority
 */
export function preloadImages(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void[]> {
    // High priority: preload immediately
    // Low priority: preload after page load
    if (priority === 'low' && typeof window !== 'undefined') {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve(Promise.all(urls.map(url => preloadImage(url).catch(() => {}))));
            } else {
                window.addEventListener('load', () => {
                    resolve(Promise.all(urls.map(url => preloadImage(url).catch(() => {}))));
                });
            }
        });
    }
    
    return Promise.all(urls.map(url => preloadImage(url).catch(() => {})));
}
