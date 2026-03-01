import { MetadataRoute } from 'next'
import { allProjectsAsync } from '@/lib/projects'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'http://ramos-portofolio.vercel.app'

  // Ambil semua project
  const projects = await allProjectsAsync()

  // URL statis (halaman tetap)
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cv`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // URL dinamis dari project
  const projectUrls: MetadataRoute.Sitemap = projects
    .filter((project) => project.status !== 'draft') // Hanya publish project
    .map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: project.updatedAt
        ? new Date(project.updatedAt)
        : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  return [...staticUrls, ...projectUrls]
}
