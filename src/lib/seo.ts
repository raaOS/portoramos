import type { Metadata } from 'next'
import type { Project } from '@/types/projects';

// Dynamic site URL detection
function getDynamicSiteUrl(): string {
  // In production, use environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://portfolio.example.com'
  }

  // In development, try to detect from browser if available
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Fallback for server-side rendering in development
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// Base SEO configuration
export const baseSEO = {
  title: 'Ramos – Creative Portfolio',
  description: 'Portofolio kreatif Ramos berisi project desain digital, UI/UX, dan visual yang berfokus pada storytelling, detail, dan pengalaman pengguna yang halus.',
  keywords: ['portfolio', 'desain', 'ui/ux', 'creative', 'digital design', 'visual design'],
  author: 'Ramos',
  get siteUrl() {
    return getDynamicSiteUrl()
  },
  image: '/images/og-default.jpg',
  locale: 'id_ID',
  type: 'website'
}

// Generate metadata for pages
export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  path = '',
  type = 'website',
  publishedTime,
  modifiedTime
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  path?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}): Metadata {
  const fullTitle = title ? `${title} | ${baseSEO.title}` : baseSEO.title
  const fullDescription = description || baseSEO.description
  const fullImage = image || baseSEO.image
  const url = `${baseSEO.siteUrl}${path}`
  const allKeywords = [...baseSEO.keywords, ...keywords]

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords.join(', '),
    authors: [{ name: baseSEO.author }],
    creator: baseSEO.author,
    publisher: baseSEO.author,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseSEO.siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: baseSEO.title,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: baseSEO.locale,
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// Generate metadata for project pages
export function generateProjectMetadata(project: Project): Metadata {
  const keywords = [
    'project',
    'portfolio',
    ...(project.tags || []),
    ...(project.client ? [project.client] : []),
    ...(project.year ? [project.year.toString()] : [])
  ]

  // Enhanced fallback description
  const fallbackDesc = `${project.title} - A ${project.tags?.[0] || 'creative'} project by Ramos` +
    (project.client ? ` for ${project.client}` : '') +
    (project.year ? ` (${project.year})` : '') +
    '. Explore the details, visuals, and story behind this work.';

  const description = project.description
    ? (project.description.length > 160 ? project.description.substring(0, 157) + '...' : project.description)
    : fallbackDesc;

  return generateMetadata({
    title: project.title,
    description,
    keywords,
    image: project.cover,
    path: `/works/${project.slug}`,
    type: 'article',
    publishedTime: project.createdAt,
    modifiedTime: project.updatedAt
  })
}

// Generate structured data (JSON-LD)
export function generateStructuredData(type: 'website' | 'portfolio' | 'project', data?: any) {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: baseSEO.title,
    description: baseSEO.description,
    url: baseSEO.siteUrl,
    author: {
      '@type': 'Person',
      name: baseSEO.author
    },
    publisher: {
      '@type': 'Organization',
      name: baseSEO.title,
      url: baseSEO.siteUrl
    }
  }

  switch (type) {
    case 'website':
      return {
        ...baseStructuredData,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseSEO.siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }

    case 'portfolio':
      return {
        ...baseStructuredData,
        '@type': 'CollectionPage',
        name: 'Portfolio',
        description: 'Collection of creative projects and digital solutions',
        url: `${baseSEO.siteUrl}/portfolio`
      }

    case 'project':
      if (!data) return baseStructuredData

      return {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: data.title,
        description: data.description,
        url: `${baseSEO.siteUrl}/works/${data.slug}`,
        image: data.cover,
        author: {
          '@type': 'Person',
          name: baseSEO.author
        },
        publisher: {
          '@type': 'Organization',
          name: baseSEO.title,
          url: baseSEO.siteUrl
        },
        keywords: data.tags?.join(', '),
        ...(data.client && {
          client: {
            '@type': 'Organization',
            name: data.client
          }
        }),
        ...(data.year && {
          dateCreated: `${data.year}-01-01`
        })
      }

    default:
      return baseStructuredData
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

// Sitemap utilities
export function generateSitemapUrls(projects: Project[]) {
  const baseUrls = [
    {
      url: '/',
      priority: 1.0,
      changefreq: 'weekly'
    },
    {
      url: '/about',
      priority: 0.8,
      changefreq: 'monthly'
    },
    {
      url: '/works',
      priority: 0.9,
      changefreq: 'weekly'
    },
    {
      url: '/contact',
      priority: 0.7,
      changefreq: 'monthly'
    }
  ]

  const projectUrls = projects.map(project => ({
    url: `/works/${project.slug}`,
    priority: 0.9,
    changefreq: 'monthly'
  }))

  return [...baseUrls, ...projectUrls]
}

export function generateSitemap(projects: Project[]): string {
  const urls = generateSitemapUrls(projects)
  const siteUrl = baseSEO.siteUrl

  const urlElements = urls.map(({ url, priority, changefreq }) => `
  <url>
    <loc>${siteUrl}${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlElements}
</urlset>`
}

// Generate project structured data (JSON-LD)
export function generateProjectStructuredData(project: Project): string {
  const structuredData = generateStructuredData('project', project)
  return JSON.stringify(structuredData)
}

// SEO utilities
export const seoUtils = {
  // Generate sitemap data
  generateSitemapData: (projects: Project[]) => {
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'weekly' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/contact', priority: 0.8, changefreq: 'monthly' },
    ]

    const projectPages = projects.map(project => ({
      url: `/works/${project.slug}`,
      priority: 0.9,
      changefreq: 'monthly'
    }))

    return [...staticPages, ...projectPages]
  },

  // Generate robots.txt content
  generateRobotsTxt: () => {
    return `User-agent: *
Allow: /

Sitemap: ${baseSEO.siteUrl}/sitemap.xml`
  },

  // Validate and clean meta description
  cleanMetaDescription: (description: string, maxLength = 160) => {
    return description.length > maxLength
      ? description.substring(0, maxLength - 3) + '...'
      : description
  },

  // Generate canonical URL
  generateCanonicalUrl: (path: string) => {
    return `${baseSEO.siteUrl}${path}`
  }
}
