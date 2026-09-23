import type { Project } from '@/types/projects';
import { baseSEO } from '../seo';

export interface ProjectStructuredData {
  title: string;
  description: string;
  cover: string;
  tags?: string[];
  client?: string;
  year?: number;
}

export interface PersonStructuredData {
  socialLinks?: string[];
}

export type StructuredDataType =
  | ProjectStructuredData
  | PersonStructuredData
  | Record<string, unknown>;

export function generateStructuredData(
  type: 'website' | 'portfolio' | 'project' | 'person',
  data?: StructuredDataType
) {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: baseSEO.title,
    description: baseSEO.description,
    url: baseSEO.siteUrl,
    author: {
      '@type': 'Person',
      name: baseSEO.author,
    },
    publisher: {
      '@type': 'Organization',
      name: baseSEO.title,
      url: baseSEO.siteUrl,
    },
  };

  switch (type) {
    case 'website':
      return {
        ...baseStructuredData,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseSEO.siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };

    case 'portfolio':
      return {
        ...baseStructuredData,
        '@type': 'CollectionPage',
        name: 'Portfolio',
        description: 'Collection of creative projects and digital solutions',
        url: `${baseSEO.siteUrl}/portfolio`,
      };

    case 'project': {
      if (!data) return baseStructuredData;
      const projectData = data as ProjectStructuredData;

      return {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: projectData.title,
        description: projectData.description,
        url: `${baseSEO.siteUrl}/projects/${(data as { slug?: string }).slug}`,
        image: projectData.cover,
        author: {
          '@type': 'Person',
          name: baseSEO.author,
        },
        publisher: {
          '@type': 'Organization',
          name: baseSEO.title,
          url: baseSEO.siteUrl,
        },
        keywords: projectData.tags?.join(', '),
        ...(projectData.client && {
          client: {
            '@type': 'Organization',
            name: projectData.client,
          },
        }),
        ...(projectData.year && {
          dateCreated: `${projectData.year}-01-01`,
        }),
      };
    }

    case 'person': {
      const personData = data as PersonStructuredData | undefined;
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: baseSEO.author,
        url: baseSEO.siteUrl,
        image: baseSEO.siteUrl + '/images/profile.jpg',
        sameAs: [...(personData?.socialLinks || [])],
        jobTitle: 'Creative Designer & Visual Storyteller',
        worksFor: {
          '@type': 'Organization',
          name: 'Freelance',
        },
        description: baseSEO.description,
        knowsAbout: ['Graphic Design', 'UI/UX', 'Motion Graphics', 'Visual Identity'],
      };
    }

    default:
      return baseStructuredData;
  }
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateProjectStructuredData(project: Project): string {
  const structuredData = generateStructuredData('project', project);
  return JSON.stringify(structuredData);
}
