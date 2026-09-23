'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface DesktopIconMediaProps {
  label: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  videoUrl?: string;
  baseHeight: number;
  aspectRatio: number;
  isSelected?: boolean;
  priority?: boolean;
  isMobile?: boolean;
  hovering: boolean;
  previewActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  children?: React.ReactNode;
}

export function DesktopIconMedia({
  label,
  icon,
  imageUrl,
  videoUrl,
  baseHeight,
  aspectRatio,
  isSelected = false,
  priority = false,
  isMobile = false,
  hovering,
  previewActive,
  videoRef,
  children,
}: DesktopIconMediaProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);

  const imageError = Boolean(imageUrl && failedImageUrl === imageUrl);
  const videoError = Boolean(videoUrl && failedVideoUrl === videoUrl);

  const hasImage = Boolean(imageUrl && !imageError);
  const hasVideo = Boolean(videoUrl && !videoError);
  const shouldRenderVideo = Boolean(hasVideo && !isMobile && (previewActive || !hasImage));
  const showMedia = hasImage || hasVideo;

  if (children) {
    return (
      <div
        className={`relative transition-transform duration-200 ${isSelected ? 'scale-[1.05]' : ''}`}
      >
        {children}
      </div>
    );
  }

  if (showMedia) {
    return (
      <div
        style={{
          height: baseHeight,
          width: baseHeight * aspectRatio,
          minWidth: baseHeight * aspectRatio,
          minHeight: baseHeight,
        }}
        className={`relative overflow-hidden rounded-none bg-white/20 transition-transform duration-200 ${isSelected ? 'scale-[1.02]' : ''}`}
      >
        {/* Image layer */}
        {imageUrl && !imageError && (
          <Image
            src={imageUrl}
            alt={label}
            fill
            className={`pointer-events-none object-cover transition-opacity duration-300 ${shouldRenderVideo ? 'opacity-0' : 'opacity-100'}`}
            sizes="(max-width: 768px) 96px, 128px"
            draggable={false}
            onError={() => setFailedImageUrl(imageUrl ?? '__missing__')}
            priority={priority}
            loading="eager"
            fetchPriority={priority ? 'high' : 'auto'}
            quality={60}
          />
        )}

        {/* Video preview */}
        {shouldRenderVideo && (
          <video
            ref={videoRef}
            src={videoUrl + '#t=0.1'}
            muted
            loop
            playsInline
            preload="metadata"
            className={`pointer-events-none absolute inset-0 h-full w-full rounded-none object-cover transition-opacity duration-300 ${!hovering && imageUrl && !imageError ? 'opacity-0' : 'opacity-100'}`}
            draggable={false}
            onError={() => setFailedVideoUrl(videoUrl ?? '__missing__')}
          />
        )}

        {/* Placeholder if failed */}
        {imageError && (!videoUrl || videoError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              No Media
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-none bg-white/20 transition-colors group-hover:bg-white/30">
      <div className="text-black/80 transition-colors group-hover:text-black">{icon}</div>
    </div>
  );
}
