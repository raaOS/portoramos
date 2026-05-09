'use client';

import { useSyncExternalStore } from 'react';
import { Link } from 'next-view-transitions';
import { ArrowLeft } from 'lucide-react';
import {
    buildProjectsHref,
    getProjectsViewModeServerSnapshot,
    readProjectsViewMode,
    subscribeProjectsViewMode,
} from '@/lib/projectsViewMode';
import { markBack } from '@/lib/navigationDirection';

interface ProjectBackButtonProps {
    label?: string;
}

export function ProjectBackButton({ label = 'Back to Projects' }: ProjectBackButtonProps) {
    // SSR-safe read dari sessionStorage via useSyncExternalStore.
    // Server snapshot selalu 'grid' (default) agar tidak hydration mismatch.
    // Client snapshot baca sessionStorage, re-read otomatis bila mode berubah.
    const mode = useSyncExternalStore(
        subscribeProjectsViewMode,
        readProjectsViewMode,
        getProjectsViewModeServerSnapshot,
    );

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
