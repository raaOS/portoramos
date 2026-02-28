import { MetadataRoute } from 'next';
import { allProjectsAsync } from '@/lib/projects';
import { baseSEO } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseSEO.siteUrl;
  const now = new Date();
  
  // Static pages with proper priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/projects`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/cv`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
  
  // Dynamic project pages
  const projects = await allProjectsAsync();
  const publishedProjects = projects.filter(p => p.status !== 'draft');
  
  const projectPages: MetadataRoute.Sitemap = publishedProjects.map((project) => ({
    url: `${base}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt || project.createdAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  
  return [...staticPages, ...projectPages];
}
