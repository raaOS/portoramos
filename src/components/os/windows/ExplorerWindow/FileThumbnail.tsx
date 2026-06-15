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
  const [isHovered, setIsHovered] = useState(false);

  const isVideo = file.fileType === 'video';
  const isImage = file.fileType === 'image';
  const videoPoster = isVideo ? file.thumbnailUrl || getVideoPosterSource(file.url) : undefined;
  const videoPreview = isVideo ? getVideoPreviewSource(file.url) || file.url : undefined;
  const src = isVideo ? videoPoster || videoPreview : file.thumbnailUrl || file.url;

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-10 h-10',
    md: 'w-16 h-20',
    lg: 'w-24 h-32',
  };

  return (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center overflow-hidden border border-black/5 bg-white shadow-sm transition-shadow group-hover:shadow-md dark:border-white/10 dark:bg-white/10`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!src || hasError ? (
        <div className="flex flex-col items-center gap-1">
          {isVideo ? (
            <VideoIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" />
          ) : isImage ? (
            <ImageIcon size={size === 'xs' ? 12 : 24} className="text-green-500 opacity-60" />
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

      {/* Type Badge (Only for larger sizes) */}
      {size !== 'xs' && (
        <div
          className={`absolute inset-x-0 bottom-0 flex h-4 items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}
        >
          <span className="text-[7px] font-black uppercase tracking-tighter text-white">
            {file.metadata?.extension || file.fileType}
          </span>
        </div>
      )}
    </div>
  );
}
