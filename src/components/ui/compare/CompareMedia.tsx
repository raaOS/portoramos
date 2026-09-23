'use client';

import React from 'react';
import { cn, getProxiedUrl } from '@/lib/utils';

interface CompareMediaProps {
  src: string;
  className?: string;
  alt: string;
  mediaType?: 'image' | 'video';
}

export function CompareMedia({ src, className, alt, mediaType }: CompareMediaProps) {
  const proxiedSrc = getProxiedUrl(src);
  const isVideo =
    mediaType === 'video' ||
    (!mediaType &&
      (proxiedSrc.toLowerCase().includes('.mp4') ||
        proxiedSrc.toLowerCase().includes('.webm') ||
        src.toLowerCase().endsWith('.mp4') ||
        src.toLowerCase().endsWith('.webm')));

  if (isVideo) {
    return (
      <video
        src={proxiedSrc}
        className={cn(className, 'object-cover')}
        autoPlay
        loop
        muted
        playsInline
        draggable={false}
      />
    );
  }

  return (
    <img
      alt={alt}
      src={proxiedSrc}
      className={className}
      draggable={false}
    />
  );
}
