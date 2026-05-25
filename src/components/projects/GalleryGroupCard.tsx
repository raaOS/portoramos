'use client';

import { motion } from 'motion/react';
import type { GalleryGroup, GalleryItem } from '@/types/projects';
import { useImageProtection } from '@/hooks/useImageProtection';
import MacFolder from '@/components/os/windows/MacFolder';

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
      className="group mb-14 w-full cursor-pointer"
      onClick={onClick}
      whileHover="hover"
      initial="initial"
    >
      <div onContextMenu={handleContextMenu} className="flex flex-col items-start">
        {/* 1. Title & Description Above Folder */}
        <div className="mb-4 w-full">
          <h3 className="whitespace-nowrap text-base font-black uppercase tracking-[0.1em] text-gray-900 transition-colors group-hover:text-blue-500 dark:text-white">
            {group.name}
          </h3>
          {group.description && (
            <p className="mt-1.5 max-w-sm whitespace-normal break-words text-[11px] italic leading-snug text-gray-500 dark:text-gray-400">
              {group.description}
            </p>
          )}
        </div>

        <div className="ml-[-8px] flex-shrink-0 transition-all duration-300 active:scale-[0.98] group-hover:scale-[1.02]">
          <MacFolder size={0.9} isStatic={true} count={validItems.length} />
        </div>
      </div>
    </motion.div>
  );
}
