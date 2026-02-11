import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'imageCache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'staticResourceCache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Compiler for automatic optimization
  reactCompiler: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Compress responses
  compress: true,
  
  // Strict mode for better error catching
  reactStrictMode: true,
  
  // Optimize images aggressively for 100/100 performance
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' }
    ],
    // Optimize image sizes for perfect scores
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    // Modern formats for best compression and performance
    formats: ['image/avif', 'image/webp'],
    // Optimize quality for performance vs size balance
    quality: 85,
    // Long cache time for CDN optimization
    minimumCacheTTL: 31536000, // 1 year
    // Enable optimization in production only
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Optimize fonts and loading
  experimental: {
    // Modern bundling
    esmExternals: true,
    // Optimize CSS for critical CSS extraction
    optimizeCss: true,
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@tabler/icons-react',
      '@tanstack/react-query',
      'react-hot-toast',
      'recharts',
      'gsap',
      'fuse.js',
      'date-fns',
      '@tsparticles/react',
      'react-intersection-observer',
      'react-masonry-css',
      'lenis'
    ],
    // Server components optimization
    serverComponentsExternalPackages: ['sharp', 'ffmpeg-static'],
  },
  
  // Webpack optimization for performance
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Optimize bundle splitting for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          // Common chunk
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
      
      // Remove moment.js locales to reduce bundle size
      config.resolve.alias = {
        ...config.resolve.alias,
        'moment$': 'moment/moment.js',
      };
      
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
  
  // Optimize headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; media-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https: http://localhost:* ws://localhost:* blob:; worker-src 'self' blob:; frame-src 'self' https://vercel.live https://vercel.com;"
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'ETag',
            value: 'W/"${Date.now()}"'
          },
          // Compression
          {
            key: 'Accept-Encoding',
            value: 'gzip, deflate, br'
          },
          // Preload critical resources
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect; crossorigin=anonymous',
          },
        ]
      },
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
          },
        ]
      },
      // Static assets caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ]
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ]
      },
      // Font optimization
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
        ]
      },
    ];
  },
  
  // Optimize redirects
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/indeks', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      // Remove trailing slashes for consistency
      {
        source: '/:path*/',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
  
  // Optimize rewrites
  async rewrites() {
    return [
      // API proxy for better performance
      {
        source: '/api/proxy/:path*',
        destination: 'https://api.github.com/:path*',
      },
    ];
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: true,
  
  // Strict TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Enable Turbopack for faster development (optional)
  experimental: {
    ...nextConfig.experimental,
    // Enable Turbopack for faster builds
    turbo: {},
  },
};

export default withPWA(nextConfig);