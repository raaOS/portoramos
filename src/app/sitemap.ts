import { allProjectsAsync } from '@/lib/projects'
import { baseSEO } from '@/lib/seo'

export default async function sitemap() {
  const base = baseSEO.siteUrl
  const now = new Date()
  const staticPages = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/works`, lastModified: now },
    { url: `${base}/explore`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/contact`, lastModified: now }
  ]
  const list = await allProjectsAsync()
  const works = list.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: now }))
  return [...staticPages, ...works]
}
