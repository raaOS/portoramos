import { allProjectsAsync } from '@/lib/projects'
import { baseSEO } from '@/lib/seo'

export default async function sitemap() {
  const base = baseSEO.siteUrl
  const now = new Date()
  const staticPages = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/contact`, lastModified: now },
    { url: `${base}/cv`, lastModified: now }
  ]
  const list = await allProjectsAsync()
  // Only include published projects in sitemap
  const publishedProjects = list.filter(p => p.status !== 'draft')
  const works = publishedProjects.map((project) => ({
    url: `${base}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt || project.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  return [...staticPages, ...works]
}
