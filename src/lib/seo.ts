import type { Metadata } from 'next';
import type { Project } from '@/types/projects';
import { DEFAULT_SITE_URL } from '@/lib/constants';

// Dynamic site URL detection
function getDynamicSiteUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

// Base SEO configuration
export const baseSEO = {
  title: 'Ramos – Creative Portfolio',
  description:
    'Portofolio kreatif Ramos berisi project desain digital, UI/UX, dan visual yang berfokus pada storytelling, detail, dan pengalaman pengguna yang halus.',
  keywords: ['portfolio', 'desain', 'ui/ux', 'creative', 'digital design', 'visual design'],
  author: 'Ramos',
  get siteUrl() {
    return getDynamicSiteUrl();
  },
  image: '/images/og-default.jpg',
  locale: 'id_ID',
  type: 'website',
};

// Generate metadata for pages
export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  path = '',
  type = 'website',
  publishedTime,
  modifiedTime,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  path?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const fullTitle = title ? `${title} | ${baseSEO.title}` : baseSEO.title;
  const fullDescription = description || baseSEO.description;
  const fullImage = image || baseSEO.image;
  const url = `${baseSEO.siteUrl}${path}`;
  const allKeywords = [...baseSEO.keywords, ...keywords];

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
  };
}

// Generate metadata for project pages
export function generateProjectMetadata(project: Project): Metadata {
  const keywords = [
    'project',
    'portfolio',
    ...(project.tags || []),
    ...(project.client ? [project.client] : []),
    ...(project.year ? [project.year.toString()] : []),
  ];

  const fallbackDesc =
    `${project.title} - A ${project.tags?.[0] || 'creative'} project by Ramos` +
    (project.client ? ` for ${project.client}` : '') +
    (project.year ? ` (${project.year})` : '') +
    '. Explore the details, visuals, and story behind this work.';

  const description = project.description
    ? project.description.length > 160
      ? project.description.substring(0, 157) + '...'
      : project.description
    : fallbackDesc;

  return generateMetadata({
    title: project.title,
    description,
    keywords,
    image: project.cover,
    path: `/projects/${project.slug}`,
    type: 'article',
    publishedTime: project.createdAt,
    modifiedTime: project.updatedAt,
  });
}

export * from './seo/structuredData';
export * from './seo/sitemapUtils';
