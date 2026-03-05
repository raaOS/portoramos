'use client';

import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import type { GalleryGroup } from '@/types/projects';
import Media from '@/components/shared/Media';
import { useImageProtection } from '@/hooks/useImageProtection';

interface GalleryGroupCardProps {
    group: GalleryGroup;
    onClick: () => void;
}

export default function GalleryGroupCard({ group, onClick }: GalleryGroupCardProps) {
    const { toast, handleContextMenu } = useImageProtection();
    const validItems = group.items.filter(item => item.isActive !== false);

    if (validItems.length === 0) return null;

    // Use up to 3 items for the stacked effect
    const stackItems = validItems.slice(0, 3);
    const mainItem = stackItems[0];

    return (
        <motion.div
            className="group cursor-pointer mb-10 w-full max-w-[600px]"
            onClick={onClick}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header Text */}
            <div className="flex flex-col mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {group.name}
                </h3>
                {group.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                        {group.description}
                    </p>
                )}
            </div>

            {/* Card Container */}
            <div className="relative aspect-[4/3] w-full" onContextMenu={handleContextMenu}>
                {/* Main Card */}
                <div
                    className="absolute top-0 left-0 w-full h-full rounded-xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-gray-900/80 transition-transform duration-300 z-10"
                >
                    <Media
                        kind={mainItem.kind}
                        src={mainItem.src}
                        poster={mainItem.poster}
                        alt={group.name}
                        width={800}
                        height={600}
                        lazy={true}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        autoplay={true}
                        muted={true}
                        loop={true}
                        playsInline={true}
                    />

                    {/* Gradient Overlay & Metadata */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white drop-shadow-md">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold tracking-wider uppercase">{validItems.length} Items</span>
                        </div>
                        <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                            View Gallery →
                        </span>
                    </div>

                    {/* Right-click Toast Overlay */}
                    {toast && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-2 z-50">
                            <span className="text-3xl">{toast.emoji}</span>
                            <p className="text-white text-[10px] font-bold text-center px-4 leading-snug">{toast.text}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
