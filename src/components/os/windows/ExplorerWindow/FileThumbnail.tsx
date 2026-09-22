import React, { useState } from 'react';
import {
  Video as VideoIcon,
  Image as ImageIcon,
  File as FileIcon,
  MonitorPlay,
} from 'lucide-react';
import { m } from 'motion/react';
import type { ExplorerFile } from '@/types/explorer';
import { getExplorerFileDisplayName } from '@/lib/utils/explorerName';
import { getVideoPosterSource, getVideoPreviewSource } from '@/lib/mediaPreview';

const withVideoStartTime = (src?: string | null) => {
  if (!src) return '';

  try {
    const url = new URL(src, window.location.origin);
    if (!url.hash) url.hash = 't=0.1';
    return url.toString();
  } catch {
    return src.includes('#') ? src : `${src}#t=0.1`;
  }
};

export default function FileThumbnail({
  file,
  size = 'md',
}: {
  file: ExplorerFile;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const displayName = getExplorerFileDisplayName(file);
  const [hasError, setHasError] = useState(false);

  const isVideo = file.fileType === 'video';
  const isImage = file.fileType === 'image';
  const isPdf = file.fileType === 'pdf';

  const videoPoster = isVideo ? file.thumbnailUrl || getVideoPosterSource(file.url) : undefined;
  const videoPreview = isVideo ? getVideoPreviewSource(file.url) || file.url : undefined;
  const pdfPoster = isPdf && file.url ? file.url.replace(/\.pdf$/i, '.jpg') : undefined;

  const src = isVideo
    ? videoPoster || videoPreview
    : isPdf
      ? file.thumbnailUrl || pdfPoster
      : file.thumbnailUrl || file.url;

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-10 h-10',
    md: 'w-16 h-20',
    lg: 'w-24 h-32',
  };

  return (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center overflow-hidden border border-black/5 bg-white shadow-sm transition-shadow group-hover:shadow-md dark:border-white/10 dark:bg-white/10`}
    >
      {!src || hasError ? (
        <div className="flex h-full w-full items-center justify-center">
          {isVideo ? (
            <VideoIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" />
          ) : isImage ? (
            <ImageIcon size={size === 'xs' ? 12 : 24} className="text-green-500 opacity-60" />
          ) : isPdf ? (
            <svg
              viewBox="0 0 48 64"
              className="h-full w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="2" width="40" height="60" rx="3" fill="#fff" stroke="#d1d5db" strokeWidth="1.5" />
              <path d="M34 2 L44 12 L34 12 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
              <path d="M34 2 L34 12 L44 12" fill="none" stroke="#d1d5db" strokeWidth="1" />
              <text x="24" y="42" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#dc2626" fontFamily="Arial, sans-serif">PDF</text>
              <rect x="12" y="48" width="24" height="3" rx="1.5" fill="#e5e7eb" />
              <rect x="12" y="54" width="18" height="3" rx="1.5" fill="#e5e7eb" />
            </svg>
          ) : (
            <FileIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" />
          )}
        </div>
      ) : isVideo ? (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full w-full">
          {videoPoster ? (
            <img
              src={videoPoster}
              alt={displayName}
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setHasError(true)}
            />
          ) : (
            <video
              src={withVideoStartTime(videoPreview)}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setHasError(false)}
              onError={() => setHasError(true)}
            />
          )}
          {size !== 'xs' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <MonitorPlay size={size === 'sm' ? 14 : 20} className="text-white drop-shadow-md" />
            </div>
          )}
        </m.div>
      ) : (
        <m.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={src}
          alt={displayName}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}

    </div>
  );
}
