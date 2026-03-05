import { NextResponse } from 'next/server';
import { projectService } from '@/lib/services/projectService';

export async function GET() {
    try {
        const slug = 'kampanye-hadiah-digital-liburan';
        const { projects } = await projectService.getProjects();
        const project = projects.find(p => p.slug === slug);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const galleryGroups = [
            {
                id: 'group-adv-1',
                name: 'Advertising & Assets',
                description: 'Berbagai aset iklan digital untuk kampanye ini.',
                items: [
                    { kind: 'image' as const, src: '/assets/projects/identitas-monogram-hijau.jpg', isActive: true },
                    { kind: 'image' as const, src: '/assets/projects/tipografi-alam-kontras-tinggi.jpg', isActive: true },
                    { kind: 'image' as const, src: '/assets/projects/overlay-bunga-barok-digital.jpg', isActive: true },
                    { kind: 'image' as const, src: '/assets/projects/tempat-perlindungan-sneaker-surealis.jpg', isActive: true }
                ]
            },
            {
                id: 'group-doc-1',
                name: 'Dokumentasi Visual',
                description: 'Hasil akhir desain dalam berbagai format.',
                items: [
                    { kind: 'image' as const, src: '/assets/projects/desain-sampul-hijau-tua.jpg', isActive: true },
                    { kind: 'image' as const, src: '/assets/projects/politik-pop-digital.jpg', isActive: true },
                    { kind: 'image' as const, src: '/assets/projects/tipografi-mekar-gotik.jpg', isActive: true }
                ]
            }
        ];

        await projectService.updateProject(project.id, {
            id: project.id,
            galleryGroups,
            narrative: {
                ...project.narrative,
                impact: "Tingkat konversi penjualan gift card meningkat 45% selama minggu pertama. Desain ini juga mendapatkan apresiasi tingkat tinggi karena berhasil menyatukan nuansa nostalgia liburan dengan estetika UI/UX aplikasi digital modern."
            }
        });

        return NextResponse.json({ success: true, message: 'Gallery groups and impact seeded for: ' + slug });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
