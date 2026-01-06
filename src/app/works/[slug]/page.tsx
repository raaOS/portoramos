
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { githubService } from '@/lib/github';
import { resolveGallery } from '@/lib/images';
import { generateProjectMetadata, generateProjectStructuredData } from '@/lib/seo';
import ProjectDetailTwoColumn from './ProjectDetailTwoColumn';

// Generate all project paths at build time
export async function generateStaticParams() {
    const { content: { projects } } = await githubService.getFile();
    return projects.map((project) => ({
        slug: project.slug,
    }));
}

// Allow new pages to be generated on demand
export const dynamicParams = true;

// Revalidate this page every 60 seconds (ISR)
export const revalidate = 60;

export default async function ProjectPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    // Use cached data for instant page load (Performance Fix)
    // Updates are handled via on-demand revalidation when Admin saves changes
    const { content: { projects } } = await githubService.getFile(false);
    const p = projects.find(project => project.slug === params.slug);

    if (!p) return notFound();

    // Get all projects for the sidebar grid (excluding current)
    // Filter out drafts if in production environment (optional, keeping consistent with allProjectsAsync)
    const allProjects = projects.filter(proj => proj.status !== 'draft');
    const otherProjects = allProjects.filter(project => project.slug !== params.slug);

    // Use detail-specific resolver for high quality hero assets (1280px video / 1600px image)
    const { resolveDetailCover } = await import('@/lib/images');
    const cover = resolveDetailCover(p);
    const gallery = resolveGallery(p);

    // Transform gallery items to match what ProjectDetailTwoColumn expects
    // The ProjectDetailTwoColumn uses unifiedMedia which accepts GalleryItem directly
    // But we need to make sure types align.
    const safeGallery = gallery.map(item => ({
        ...item,
        // kind from GalleryItem ('image' | 'video') maps to type in some contexts, but here unifiedMedia handles it
    }));

    const ratio = (cover.width && cover.height) ? cover.width / cover.height : 16 / 9;
    const structuredData = generateProjectStructuredData(p);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: structuredData }}
            />
            <ProjectDetailTwoColumn
                key={p.slug}
                project={p}
                cover={cover}
                gallery={safeGallery}
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
    const { content: { projects } } = await githubService.getFile();
    const p = projects.find(project => project.slug === params.slug);

    if (!p) return { title: 'Project Not Found' };

    return generateProjectMetadata(p);
}
