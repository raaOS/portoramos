'use client';

import React from 'react';
import { m } from 'framer-motion';
import { Folder } from 'lucide-react';

interface FolderIconProps {
    className?: string;
}

export default function FolderIcon({ className = '' }: FolderIconProps) {
    return (
        <div className={`relative flex items-center justify-center group/folder ${className}`}>
            {/* Folder Visual */}
            <m.div
                className="relative"
                variants={{
                    hover: { scale: 1.1 }
                }}
            >
                <Folder
                    className="w-16 h-16 text-yellow-500 dark:text-yellow-400 fill-yellow-500/10 dark:fill-yellow-400/10 transition-colors"
                    strokeWidth={1.2}
                />
            </m.div>
        </div>
    );
}
