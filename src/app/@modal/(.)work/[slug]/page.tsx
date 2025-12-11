
import { getProjectBySlugAsync, allProjectsAsync } from '@/lib/projects';
import { resolveCover, resolveGallery } from '@/lib/images';
import ProjectDetailClient from '@/app/work/[slug]/ProjectDetailClient';
import Modal from '@/components/Modal';
import { notFound } from 'next/navigation';


export default async function InterceptedProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const p = await getProjectBySlugAsync(slug);

    if (!p) return notFound();

    // Basic layout logic reuse
    const cover = resolveCover(p);
    const ratio = (cover.width && cover.height) ? cover.width / cover.height : 16 / 9;

    let layoutStrategy = {
        type: 'unknown',
        layout: 'grid',
        heroWidth: 'half',
        heroHeight: 'auto',
        contentWidth: 'half'
    } as any;

    if (cover.width && cover.height) {
        const aspectRatio = cover.width / cover.height;
        if (aspectRatio < 1) {
            layoutStrategy = { type: 'portrait', layout: 'grid', heroWidth: 'half', heroHeight: 'auto', contentWidth: 'half' };
        } else if (aspectRatio === 1) {
            layoutStrategy = { type: 'square', layout: 'grid', heroWidth: 'half', heroHeight: 'square', contentWidth: 'half' };
        } else {
            layoutStrategy = { type: 'landscape', layout: 'grid', heroWidth: 'half', heroHeight: 'auto', contentWidth: 'half' };
        }
    }

    const gallery = resolveGallery(p);

    return (
        <Modal>
            <div className="bg-white min-h-screen pb-10">
                <ProjectDetailClient
                    p={p}
                    cover={cover}
                    gallery={gallery}
                    ratio={ratio}
                    layoutStrategy={layoutStrategy}
                />
            </div>
        </Modal>
    );
}

export async function generateStaticParams() {
    const projects = await allProjectsAsync();
    return projects.map((project) => ({
        slug: project.slug,
    }));
}
