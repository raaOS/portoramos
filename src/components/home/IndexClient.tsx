import { allProjectsAsync } from '@/lib/projects'
import IndexClientInner from './IndexClientInner'

type Props = {
  searchParams?: { tag?: string }
}

export default async function IndexClient(props: Props) {
  const searchParams = await props.searchParams;

  try {
    const projects = await allProjectsAsync()
    const tag = searchParams?.tag || ''

    return <IndexClientInner projects={projects} tag={tag} searchQuery="" />
  } catch (e) {
    console.error('IndexClient: error', e);
    throw e;
  }
}
