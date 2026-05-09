'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { ArrowLeft } from 'lucide-react';
import {
    buildProjectsHref,
    readProjectsViewMode,
    type ProjectsViewMode,
} from '@/lib/projectsViewMode';
import { markBack } from '@/lib/navigationDirection';

interface ProjectBackButtonProps {
    label?: string;
}

export function ProjectBackButton({ label = 'Back to Projects' }: ProjectBackButtonProps) {
    // Default 'grid' agar tombol tetap punya href valid di SSR & sebelum hydrate.
    const [mode, setMode] = useState<ProjectsViewMode>('grid');

    useEffect(() => {
        // Setelah hydrate, baca mode terakhir dari sessionStorage.
        // Kalau user sebelumnya pakai 3D canvas → balik ke 3D canvas,
        // kalau grid → balik ke grid.
        setMode(readProjectsViewMode());
    }, []);

    return (
        <Link
            href={buildProjectsHref(mode)}
            // Tandai navigasi ini sebagai "back" agar slide dari arah kiri.
            // Pakai onClickCapture agar set attribute SEBELUM next-view-transitions
            // trigger document.startViewTransition (React capture phase jalan duluan).
            onClickCapture={markBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white mb-4 sm:mb-6 transition-colors duration-200 touch-manipulation"
        >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{label}</span>
        </Link>
    );
}
