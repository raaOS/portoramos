'use client';

import { motion } from 'framer-motion';
import type { GalleryGroup, GalleryItem } from '@/types/projects';
import { useImageProtection } from '@/hooks/useImageProtection';
import FolderIcon from '@/components/ui/FolderIcon';

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
                <div className="mb-3 space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {group.name}
                    </h3>
                    {group.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed max-w-[280px]">
                            {group.description}
                        </p>
                    )}
                </div>

                {/* 2. Folder Icon */}
                <FolderIcon />

                {/* 3. Metadata Below Folder */}
                <div className="mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {validItems.length} Items
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
