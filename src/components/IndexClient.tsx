import Card from '@/components/Card'
import type { Project } from '@/types/projects'
import { allProjectsAsync } from '@/lib/projects'
import IndexClientInner from './IndexClientInner'

type Props = {
  searchParams?: { tag?: string }
}

export default async function IndexClient({ searchParams }: Props) {
  const projects = await allProjectsAsync()
  const tag = searchParams?.tag || ''

  return <IndexClientInner projects={projects} tag={tag} />
}
