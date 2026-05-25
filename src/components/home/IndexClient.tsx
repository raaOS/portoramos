import { allProjectsAsync } from '@/lib/projects';
import IndexClientInner from './IndexClientInner';

type Props = {
  searchParams?: { tag?: string };
};

// BUG FIX #4: Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <section className="px-4 pb-8 pt-4">
      <div className="rounded-lg border-2 border-dashed border-red-300 p-12 text-center">
        <p className="mb-2 text-lg text-red-600">Gagal memuat projects</p>
        <p className="text-sm text-gray-500">
          {error.message || 'Terjadi kesalahan saat memuat data'}
        </p>
      </div>
    </section>
  );
}

export default async function IndexClient(props: Props) {
  const searchParams = await props.searchParams;

  const tag = searchParams?.tag || '';
  let projects = [];

  try {
    projects = await allProjectsAsync();
  } catch (e) {
    console.error('IndexClient: error', e);
    return <ErrorFallback error={e instanceof Error ? e : new Error('Unknown error')} />;
  }

  return <IndexClientInner projects={projects} tag={tag} searchQuery="" />;
}
