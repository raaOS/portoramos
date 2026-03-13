'use client';

import { motion } from 'framer-motion';
import type { GalleryGroup, GalleryItem } from '@/types/projects';
import { useImageProtection } from '@/hooks/useImageProtection';
import MacFolder from '@/app/about/_components/os/windows/MacFolder';

interface GalleryGroupCardProps {
    group: GalleryGroup;
    onClick: () => void;
}

export default function GalleryGroupCard({ group, onClick }: GalleryGroupCardProps) {
    const { handleContextMenu } = useImageProtection();
    const validItems = group.items.filter((item: GalleryItem) => item.isActive !== false);

    if (validItems.length === 0) return null;

    return (
        <motion.div
            className="group cursor-pointer mb-14 w-full"
            onClick={onClick}
            whileHover="hover"
            initial="initial"
        >
            <div onContextMenu={handleContextMenu} className="flex flex-col items-start">
                {/* 1. Title & Description Above Folder */}
                <div className="mb-4 w-full">
                    <h3 className="text-base font-black uppercase tracking-[0.1em] text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors whitespace-nowrap">
                        {group.name}
                    </h3>
                    {group.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 italic leading-snug mt-1.5 whitespace-normal break-words max-w-sm">
                            {group.description}
                        </p>
                    )}
                </div>

                <div className="flex-shrink-0 ml-[-8px] transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]">
                    <MacFolder size={0.9} isStatic={true} count={validItems.length} />
                </div>
            </div>
        </motion.div>
    );
}
