import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allProjectsAsync } from '@/lib/projects'
import ProjectDetailTwoColumn from '@/components/projects/ProjectDetailTwoColumn'
import { resolveCover, resolveGallery } from '@/lib/images'

interface ProjectPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const projects = await allProjectsAsync()
  const project = projects.find(p => p.slug === slug && p.status !== 'draft')
  
  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} | Ramos Portfolio`,
    description: project.description || `Project ${project.title} oleh Ramos.`,
    openGraph: {
      title: project.title,
      description: project.description || `Project ${project.title} oleh Ramos.`,
      images: [project.cover || '/placeholder.jpg'],
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const projects = await allProjectsAsync()
  const project = projects.find(p => p.slug === slug && p.status !== 'draft')
  
  if (!project) {
    notFound()
  }

  const otherProjects = projects.filter(p => p.id !== project.id && p.status !== 'draft')
  const cover = resolveCover(project)
  const gallery = resolveGallery(project)
  
  const ratio = (project.coverWidth && project.coverHeight) 
    ? project.coverWidth / project.coverHeight 
    : 16 / 9

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <ProjectDetailTwoColumn
        project={project}
        cover={cover}
        gallery={gallery}
        ratio={ratio}
        otherProjects={otherProjects}
        isWindowMode={false}
      />
    </main>
  )
}