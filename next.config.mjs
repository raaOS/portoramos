/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' }
    ],
    // Configure image qualities to support both 75 (default) and 90 (high quality)
    qualities: [75, 90],
    // Enable image optimization for better performance (disabled in dev to avoid localPatterns issues, ENABLED in prod)
    unoptimized: process.env.NODE_ENV !== 'production',
    // Granular sizes for perfect mobile masonry grid (245px * 2 DPR = 490px -> 512px match)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      {
        pathname: '/api/img',
        search: '?u=*',
      },
    ],
  },
  // Enable production source maps for better error tracking
  productionBrowserSourceMaps: true,
  // Optimize static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Improve static asset handling
  trailingSlash: false,
  // Use default build ID generation
  // Disable experimental features to fix chunk loading issues
  // Enable experimental features
  experimental: {
    // Enable modern bundling
    esmExternals: true,
    // Optimize CSS for better performance (inline critical CSS) - requires 'critters' package
    optimizeCss: true,
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@tanstack/react-query',
      'react-hot-toast',
      'recharts',
      'gsap',
      'fuse.js',
      'slate',
      'slate-react',
      'slate-history'
    ],
  },
  // Simplified webpack configuration - disabled to fix ChunkLoadError
  // webpack: (config, { dev, isServer }) => {
  //   // Only apply optimizations in production
  //   if (!dev && !isServer) {
  //     config.optimization.splitChunks = {
  //       chunks: 'all',
  //       cacheGroups: {
  //         default: {
  //           minChunks: 2,
  //           priority: -20,
  //           reuseExistingChunk: true,
  //         },
  //         vendor: {
  //           test: /[\\/]node_modules[\\/]/,
  //           name: 'vendors',
  //           priority: -10,
  //           chunks: 'all',
  //         },
  //       },
  //     }
  //   }
  //   return config
  // },
  async rewrites() {
    return [
      // Swallow legacy Vite HMR client requests (harmless 404s in Next dev)
      { source: '/@vite/:path*', destination: '/api/dev/vite-client' },
    ]
  },
  async redirects() {
    return [
      { source: '/index', destination: '/filter', permanent: true },
      { source: '/indeks', destination: '/filter', permanent: true }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://vercel.live https://vercel.com;"
          }
        ]
      }
    ]
  }
}

export default nextConfig
