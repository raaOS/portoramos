/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Compiler for automatic optimization
  reactCompiler: true,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },

      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' }
    ],
    // Configure image qualities to support both 75 (default), 85 (wallpaper), and 90 (high quality)
    qualities: [75, 85, 90],
    // Enable image optimization for better performance (disabled in dev to avoid localPatterns issues, ENABLED in prod)
    // Enable image optimization for better performance
    unoptimized: false,
    // Limit generation to reasonable sizes to prevent Vercel timeout on 4k requests
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
  },
  // Transpile packages (empty - Three.js removed as unused)
  transpilePackages: [],
  // Disable production source maps for smaller bundle (enable for debugging)
  productionBrowserSourceMaps: false,
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
    // Enable CSS optimization for tree-shaking and inlining critical CSS
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
  //   // Disable minification to fix Spline build issue
  //   if (!dev) {
  //     config.optimization.minimize = false;
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
            // Added connect-src blob: and script-src blob: for FFmpeg.wasm
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; media-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https: http://localhost:* ws://localhost:* blob:; worker-src 'self' blob:; frame-src 'self' https://vercel.live https://vercel.com;"
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      }
    ]
  }
}

export default nextConfig
