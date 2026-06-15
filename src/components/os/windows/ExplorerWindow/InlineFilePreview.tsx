import React from 'react';
import { File as FileIcon } from 'lucide-react';
import { ExplorerFormatBadge } from '@/components/ui/ExplorerFormatBadge';
import type { ExplorerFile } from '@/types/explorer';
import { getExplorerFileDisplayName, getExplorerActualFormat } from '@/lib/utils/explorerName';
import ExplorerVideoPreview from './ExplorerVideoPreview';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function InlineFilePreview({ file }: { file: ExplorerFile }) {
  const displayName = getExplorerFileDisplayName(file);
  const actualFormat = getExplorerActualFormat(file);
  const dimensions =
    file.metadata?.width && file.metadata?.height
      ? `${file.metadata.width} x ${file.metadata.height}`
      : null;
  const details = [actualFormat, formatSize(file.size || 0), dimensions]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <div className="mb-4 flex shrink-0 items-start justify-between gap-4 border-b border-black/5 pb-3 dark:border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {displayName}
            </h2>
            <ExplorerFormatBadge
              format={actualFormat}
              className="bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-300"
            />
          </div>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {details}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-black/[0.03] dark:bg-white/[0.04]">
        {file.fileType === 'image' ? (
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={file.url}
              alt={displayName}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        ) : file.fileType === 'video' ? (
          <ExplorerVideoPreview key={file.id} file={file} />
        ) : file.fileType === 'pdf' || file.fileType === 'text' ? (
          <iframe src={file.url} title={displayName} className="h-full w-full border-0 bg-white" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
            <FileIcon size={40} strokeWidth={1.5} />
            <span className="text-xs font-medium">{displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
