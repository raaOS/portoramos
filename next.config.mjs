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
  reactStrictMode: true,
  compress: true,
  // ... (rest of the images config)

  // Optimize images for maximum performance
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'postimg.cc' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: 'images2.imgbox.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' }
    ],
    // Enable optimization in production only
    unoptimized: process.env.NODE_ENV === 'development',
    // Optimize device sizes for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    // Modern formats for best compression and performance
    formats: ['image/avif', 'image/webp'],
    // Supported image qualities to match assets
    qualities: [60, 75, 85, 90],
    // Long cache time for CDN optimization (1 year)
    minimumCacheTTL: 31536000,
    // Security: prevent SVG injection attacks
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Transpile packages that need ESM handling
  transpilePackages: ['firebase', 'motion'],

  // Optimize static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Improve static asset handling
  trailingSlash: false,

  // Enable experimental features for performance
  experimental: {
    // Enable optimistic client cache for faster navigation
    optimisticClientCache: true,
    // Enable scroll restoration
    scrollRestoration: true,
  },

  // Turbopack configuration (Next.js 16 Stable Bundler)
  turbopack: {},

  // Externalize heavy server dependencies to fix Vercel lambda size limits
  serverExternalPackages: ['firebase-admin'],

  // Webpack optimization for performance (fallback when using --webpack flag)
  webpack: (config, { dev, isServer }) => {
    // Fix ESM .mjs module resolution (required for framer-motion and similar packages)
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Tactical Aliases to resolve ESM resolution issues in Next.js 16 Webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      // Map firebase subpaths to help Webpack find the correct ESM bundles via @firebase packages
      'firebase/app': '@firebase/app',
      'firebase/database': '@firebase/database',
    };

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
            test: /[\\/]node_modules[\\/](motion|lucide-react|@tabler|@tsparticles|firebase)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Animation chunk
          animations: {
            name: 'animations',
            test: /[\\/]node_modules[\\/](motion|gsap)[\\/]/,
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
      // Handle __webpack_hmr requests to suppress 404 errors in logs
      {
        source: '/__webpack_hmr',
        destination: '/api/empty'
      },
      {
        source: '/events',
        destination: '/api/empty'
      }
    ]
  },
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/indeks', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      // Redirect /works to /projects - permanent redirect
      { source: '/works/:slug*', destination: '/projects/:slug*', permanent: true },
      { source: '/project/:slug*', destination: '/projects/:slug*', permanent: true },
      // Note: trailing slash removal is handled by trailingSlash: false
    ]
  },
  async headers() {
    return [
      // Cache control for static JS/CSS files (re-enabled after fix)
      // Cache control for Home page (HTML)
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=59, must-revalidate'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          // Security Headers for Best Practices 100
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
          },
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
      // Static assets caching (production only - skip in dev to avoid Next.js warning)
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ]
        }
      ] : []),
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

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

// Next.js Restart: fix hydration mismatch v1
import createBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);

