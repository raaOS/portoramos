import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { allProjectsAsync, getProjectBySlugAsync } from '@/lib/projects';
import CoverFlowGallery from '@/components/CoverFlowGallery';
import PrevNext from '@/components/PrevNext';
import HeroShared from '@/components/HeroShared';
import { resolveCover, resolveGallery } from '@/lib/images'
import { generateProjectMetadata, generateProjectStructuredData } from '@/lib/seo';
import ProjectDetailClient from './ProjectDetailClient';

import DetailMeta from './DetailMeta'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: { slug: string } }){
  const p = await getProjectBySlugAsync(params.slug);
  if(!p) return notFound();
  const list = await allProjectsAsync();
  const cover = resolveCover(p)
  // Calculate flexible aspect ratio for project detail
  const calculateDetailRatio = () => {
    // Use natural aspect ratio if available, fallback to 16:9
    if (cover.width && cover.height) {
      return cover.width / cover.height
    }
    // Default to 16:9 for consistent experience
    return 16/9
  }
  
  const ratio = calculateDetailRatio()
  
  // Determine layout strategy based on aspect ratio
  const getLayoutStrategy = () => {
    if (cover.width && cover.height) {
      const aspectRatio = cover.width / cover.height
      
      // Portrait videos (height > width) - 9:16, 3:4, etc.
      if (aspectRatio < 1) {
        return {
          type: 'portrait',
          layout: 'grid', // Use 2-column grid for horizontal layout
          heroWidth: 'half', // Half width for portrait
          heroHeight: 'auto', // Auto height to maintain ratio
          contentWidth: 'half'
        }
      }
      
      // Square videos (1:1)
      if (aspectRatio === 1) {
        return {
          type: 'square',
          layout: 'grid', // Use 2-column grid
          heroWidth: 'half', // Half width
          heroHeight: 'square', // Square container
          contentWidth: 'half'
        }
      }
      
      // Landscape videos (width > height) - 16:9, 4:3, etc.
      return {
        type: 'landscape',
        layout: 'grid', // Use 2-column grid
        heroWidth: 'half', // Half width
        heroHeight: 'auto', // Auto height
        contentWidth: 'half'
      }
    }
    
    // Default for unknown aspect ratio
    return {
      type: 'unknown',
      layout: 'grid',
      heroWidth: 'half',
      heroHeight: 'auto',
      contentWidth: 'half'
    }
  }
  
  const layoutStrategy = getLayoutStrategy()
  const gallery = resolveGallery(p)
  const structuredData = generateProjectStructuredData(p);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
              <ProjectDetailClient 
                p={p}
                cover={cover}
                gallery={gallery}
                ratio={ratio}
                layoutStrategy={layoutStrategy}
              />
    </>
  );
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const p = await getProjectBySlugAsync(params.slug);
  if (!p) return { title: 'Project Not Found' };
  
  return generateProjectMetadata(p);
}
