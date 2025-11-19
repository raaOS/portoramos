/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ],
    // Enable image optimization for better performance
    unoptimized: false,
  },
  // Enable production source maps for better error tracking
  productionBrowserSourceMaps: true,
  // Optimize static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Improve static asset handling
  trailingSlash: false,
  // Use default build ID generation
  // Disable experimental features to fix chunk loading issues
  experimental: {
    // Temporarily disabled to fix ChunkLoadError
    // optimizePackageImports: ['framer-motion', 'gsap', 'three'],
  },
  // Optimize page loading and prevent hard refresh issues
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Enable experimental features for better navigation
  experimental: {
    // Enable modern bundling
    esmExternals: true,
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
  }
}

export default nextConfig
