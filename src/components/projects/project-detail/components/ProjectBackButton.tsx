'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProjectBackButtonProps {
    label?: string;
}

export function ProjectBackButton({ label = 'Back to Projects' }: ProjectBackButtonProps) {
    return (
        <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white mb-4 sm:mb-6 transition-colors duration-200 touch-manipulation"
        >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{label}</span>
        </Link>
    );
}
