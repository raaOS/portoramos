import { MetadataRoute } from 'next';
import { DEFAULT_SITE_URL } from '@/lib/constants';

// Edge runtime: hanya generate static config object, tidak ada Node API.
// Cold start <50ms vs ~300-500ms di Node lambda.
export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api', '/api/*', '/_next', '/_next/*'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api', '/api/*'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/assets', '/assets/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
