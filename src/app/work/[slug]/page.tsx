import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { allProjectsAsync, getProjectBySlugAsync } from '@/lib/projects';
import { resolveCover, resolveGallery } from '@/lib/images';
import { generateProjectMetadata, generateProjectStructuredData } from '@/lib/seo';
import ProjectDetailTwoColumn from './ProjectDetailTwoColumn';

// Generate all project paths at build time
export async function generateStaticParams() {
  const projects = await allProjectsAsync();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const p = await getProjectBySlugAsync(params.slug);
  if (!p) return notFound();

  // Get all projects for the sidebar grid (excluding current)
  const allProjects = await allProjectsAsync();
  const otherProjects = allProjects.filter(project => project.slug !== params.slug);

  const cover = resolveCover(p);
  const gallery = resolveGallery(p);
  const ratio = (cover.width && cover.height) ? cover.width / cover.height : 16 / 9;
  const structuredData = generateProjectStructuredData(p);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <ProjectDetailTwoColumn
        project={p}
        cover={cover}
        gallery={gallery}
        ratio={ratio}
        otherProjects={otherProjects}
      />
    </>
  );
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const p = await getProjectBySlugAsync(params.slug);
  if (!p) return { title: 'Project Not Found' };

  return generateProjectMetadata(p);
}

