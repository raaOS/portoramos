/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow development requests from multiple origins to avoid cross-origin warnings in Next.js 16
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.100.57:3000',
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.100.57:3000',
    '127.0.0.1',
    'localhost'
  ],
  // Enable React Compiler for automatic optimization
  reactCompiler: true,
  compress: true,
  // Optimize images for maximum performance
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'postimg.cc' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: 'images2.imgbox.com' }
    ],
    // Enable optimization in production only
    unoptimized: process.env.NODE_ENV === 'development',
    // Optimize device sizes for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    // Modern formats for best compression and performance
    formats: ['image/avif', 'image/webp'],
    // Long cache time for CDN optimization (1 year)
    minimumCacheTTL: 31536000,
  },
  // Transpile packages (empty - Three.js removed as unused)
  transpilePackages: [],

  // Optimize static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Improve static asset handling
  trailingSlash: false,
  // Use default build ID generation
  // Enable experimental features for performance
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
      'recharts',
      'gsap',
      'fuse.js',
      'slate',
      'slate-react',
      'slate-history',
      '@tabler/icons-react',
      '@tsparticles/react',
      'react-intersection-observer',
      'react-masonry-css',
      'lenis',
      'date-fns'
    ],
  },
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {},
  // Webpack optimization for performance (fallback when using --webpack flag)
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle splitting for better caching and performance
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // UI library chunk
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](framer-motion|lucide-react|@tabler|@tsparticles)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Animation chunk
          animations: {
            name: 'animations',
            test: /[\\/]node_modules[\\/](framer-motion|gsap)[\\/]/,
            chunks: 'all',
            priority: 25,
          },
        },
      };

      // Optimize module IDs for better caching
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';

      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Remove moment.js locales to reduce bundle size
      config.resolve.alias = {
        ...config.resolve.alias,
        'moment$': 'moment/moment.js',
      };
    }

    return config;
  },
  async rewrites() {
    return [
      // Swallow legacy Vite HMR client requests (harmless 404s in Next dev)
      { source: '/@vite/:path*', destination: '/api/dev/vite-client' },
    ]
  },
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/indeks', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      // Redirect /works to /projects - permanent redirect
      { source: '/works/:slug*', destination: '/projects/:slug*', permanent: true },
      // Note: trailing slash removal is handled by trailingSlash: false
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          // Resource hints
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect; crossorigin=anonymous'
          }
        ]
      },
      // Static assets caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=31536000, immutable'
          }
        ]
      },
      // API caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  },
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: true,
  // Strict mode for quality
  typescript: {
    ignoreBuildErrors: false,
  },
}

// Next.js Restart: fix hydration mismatch v1
export default nextConfig
