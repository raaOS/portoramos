import { allProjectsAsync } from '@/lib/projects'
import IndexClientInner from './IndexClientInner'

type Props = {
  searchParams?: { tag?: string }
}

// BUG FIX #4: Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <section className="pt-4 pb-8 px-4">
      <div className="p-12 border-2 border-dashed border-red-300 rounded-lg text-center">
        <p className="text-red-600 text-lg mb-2">Gagal memuat projects</p>
        <p className="text-gray-500 text-sm">{error.message || 'Terjadi kesalahan saat memuat data'}</p>
      </div>
    </section>
  );
}

export default async function IndexClient(props: Props) {
  const searchParams = await props.searchParams;

  const tag = searchParams?.tag || ''
  let projects = []
  
  try {
    projects = await allProjectsAsync()
  } catch (e) {
    console.error('IndexClient: error', e);
    return <ErrorFallback error={e instanceof Error ? e : new Error('Unknown error')} />;
  }

  return <IndexClientInner projects={projects} tag={tag} searchQuery="" />
}
