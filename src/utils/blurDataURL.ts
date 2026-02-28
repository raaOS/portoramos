/**
 * Generate blur data URL for images
 * Uses default SVG blur for all images
 */

export function generateBlurDataURL(_imageUrl: string): string {
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
