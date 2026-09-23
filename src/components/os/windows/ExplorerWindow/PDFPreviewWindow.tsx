'use client';

import React from 'react';
import type { ExplorerFile } from '@/types/explorer';

/**
 * Window pembaca PDF terpisah (meniru aplikasi Preview macOS).
 * Dibuka dari Project Explorer sebagai window OS mandiri, bukan inline
 * di dalam Explorer dan bukan tab browser baru.
 */
export default function PDFPreviewWindow({ file }: { file: ExplorerFile }) {
  return (
    <div className="flex h-full w-full flex-col">
      <iframe
        src={file.url}
        title={file.name}
        className="h-full w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}