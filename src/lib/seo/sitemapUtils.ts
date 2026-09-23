import type { Project } from '@/types/projects';
import { baseSEO } from '../seo';

export function generateSitemapUrls(projects: Project[]) {
  const baseUrls = [
    {
      url: '/',
      priority: 1.0,
      changefreq: 'weekly',
    },
    {
      url: '/projects',
      priority: 0.9,
      changefreq: 'weekly',
    },
    {
      url: '/contact',
      priority: 0.7,
      changefreq: 'monthly',
    },
  ];

  const projectUrls = projects.map((project) => ({
    url: `/projects/${project.slug}`,
    priority: 0.9,
    changefreq: 'monthly',
  }));

  return [...baseUrls, ...projectUrls];
}

export function generateSitemap(projects: Project[]): string {
  const urls = generateSitemapUrls(projects);
  const siteUrl = baseSEO.siteUrl;

  const urlElements = urls
    .map(
      ({ url, priority, changefreq }) => `
  <url>
    <loc>${siteUrl}${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlElements}
</urlset>`;
}

export const seoUtils = {
  generateSitemapData: (projects: Project[]) => {
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'weekly' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/contact', priority: 0.8, changefreq: 'monthly' },
    ];

    const projectPages = projects.map((project) => ({
      url: `/projects/${project.slug}`,
      priority: 0.9,
      changefreq: 'monthly',
    }));

    return [...staticPages, ...projectPages];
  },

  generateRobotsTxt: () => {
    return `User-agent: *
Allow: /

Sitemap: ${baseSEO.siteUrl}/sitemap.xml`;
  },

  cleanMetaDescription: (description: string, maxLength = 160) => {
    return description.length > maxLength
      ? description.substring(0, maxLength - 3) + '...'
      : description;
  },

  generateCanonicalUrl: (path: string) => {
    return `${baseSEO.siteUrl}${path}`;
  },
};
