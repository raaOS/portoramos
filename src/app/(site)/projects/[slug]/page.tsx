import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allProjectsAsync, getProjectBySlugAsync } from '@/lib/projects';
import ProjectPdfViewer from '@/components/projects/ProjectPdfViewer';
import { resolveCover } from '@/lib/images';
import { generateProjectMetadata, generateStructuredData } from '@/lib/seo';

export const revalidate = 60;

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlugAsync(slug);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return generateProjectMetadata(project);
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const projects = await allProjectsAsync();
  const project = projects.find((p) => p.slug === slug && p.status !== 'draft');

  if (!project) {
    notFound();
  }

  const cover = resolveCover(project);

  return (
    <main className="h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateStructuredData('project', {
              title: project.title,
              description: project.description || '',
              cover: cover,
              tags: project.tags,
              client: project.client || undefined,
              year: project.year,
              slug: project.slug,
            })
          ).replace(/</g, '\\u003c'),
        }}
      />
      <ProjectPdfViewer project={project} isWindowMode={false} />
    </main>
  );
}
