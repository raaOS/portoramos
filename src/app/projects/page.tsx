import type { Metadata } from 'next'
import { Suspense } from 'react'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import { loadAboutData } from '@/lib/about'
import SystemNavFrame from '@/components/layout/SystemNavFrame'
import { Grid, List, LayoutGrid, Filter } from 'lucide-react'

// Disable caching for Projects page to ensure immediate dock/content updates
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Projects | Ramos Portfolio',
    description: 'Daftar lengkap project desain dan pengembangan oleh Ramos.',
}

export default async function ProjectsPage() {
    const [projects, aboutData] = await Promise.all([
        allProjectsAsync(),
        loadAboutData()
    ]);

    const filteredProjects = (projects || [])
        .filter(p => p.status !== 'draft');

    return (
        <SystemNavFrame>
            <main id="main-content" role="main" className="flex-1 bg-white">
                {/* Finder-style Title Bar */}
                <div className="bg-[#F6F6F6] border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                            <LayoutGrid size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Koleksi Project</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{filteredProjects.length} Items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center bg-gray-200/50 p-1 rounded-md border border-gray-300/50">
                            <button className="p-1.5 bg-white shadow-sm rounded border border-gray-200 text-blue-600"><Grid size={14} /></button>
                            <button className="p-1.5 hover:bg-white transition-colors rounded text-gray-400"><List size={14} /></button>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
                            <Filter size={12} /> Filter
                        </button>
                    </div>
                </div>

                <Suspense fallback={
                    <section className="py-24 px-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Memuat koleksi project...</p>
                    </section>
                }>
                    <IndexClientWithAutoUpdate initialProjects={filteredProjects} />
                </Suspense>
            </main>
        </SystemNavFrame>
    );
}
