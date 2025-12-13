/**
 * Generate blur data URL for images
 * For Cloudinary images, use transformation
 * For others, use default SVG blur
 */

export function generateBlurDataURL(imageUrl: string): string {
  // Check if it's a Cloudinary URL
  if (imageUrl.includes('cloudinary.com')) {
    // Use Cloudinary's blur transformation
    return imageUrl.replace('/upload/', '/upload/e_blur:1000,q_1,f_auto/');
  }

  // Default SVG blur placeholder
  const shimmer = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f3f4f6" offset="0%" />
          <stop stop-color="#e5e7eb" offset="50%" />
          <stop stop-color="#f3f4f6" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  `;

  // Use btoa for browser, Buffer for server
  const base64 = typeof window !== 'undefined'
    ? btoa(shimmer)
    : Buffer.from(shimmer).toString('base64');

  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get optimized Cloudinary URL
 */
export function getOptimizedImageUrl(imageUrl: string, width: number = 800): string {
  if (!imageUrl.includes('cloudinary.com')) return imageUrl;

  return imageUrl.replace(
    '/upload/',
    `/upload/w_${width},f_auto,q_auto,c_limit/`
  );
}
