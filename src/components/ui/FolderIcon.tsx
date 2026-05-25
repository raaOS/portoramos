'use client';

import React from 'react';
import { m } from 'motion/react';
import { Folder } from 'lucide-react';

interface FolderIconProps {
  className?: string;
}

export default function FolderIcon({ className = '' }: FolderIconProps) {
  return (
    <div className={`group/folder relative flex items-center justify-center ${className}`}>
      {/* Folder Visual */}
      <m.div
        className="relative"
        variants={{
          hover: { scale: 1.1 },
        }}
      >
        <Folder
          className="h-16 w-16 fill-yellow-500/10 text-yellow-500 transition-colors dark:fill-yellow-400/10 dark:text-yellow-400"
          strokeWidth={1.2}
        />
      </m.div>
    </div>
  );
}
