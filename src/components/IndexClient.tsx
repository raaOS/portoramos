import Card from '@/components/Card'
import type { Project } from '@/types/projects'
import { allProjectsAsync } from '@/lib/projects'
import IndexClientInner from './IndexClientInner'

type Props = {
  searchParams?: { tag?: string }
}

export default async function IndexClient(props: Props) {
  const searchParams = await props.searchParams;
  console.log('IndexClient: rendering', { searchParams });

  try {
    const projects = await allProjectsAsync()
    console.log('IndexClient: projects fetched', projects?.length);
    const tag = searchParams?.tag || ''

    return <IndexClientInner projects={projects} tag={tag} />
  } catch (e) {
    console.error('IndexClient: error', e);
    throw e;
  }
}
