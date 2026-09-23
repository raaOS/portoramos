'use client';

import React from 'react';
import Image from 'next/image';
import { getProxiedUrl } from '@/lib/utils';
import { generateBlurDataURL } from './blurPlaceholder';

interface VideoPosterOverlayProps {
  poster: string;
  alt: string;
  width: number;
  height: number;
  effectivePosterPriority?: boolean;
  shouldLoadPosterEagerly?: boolean;
  sizes?: string;
  className?: string;
  blurDataURL?: string;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  canPlay: boolean;
}

export function VideoPosterOverlay({
  poster,
  alt,
  width,
  height,
  effectivePosterPriority,
  shouldLoadPosterEagerly,
  sizes,
  className,
  blurDataURL,
  quality,
  objectFit = 'cover',
  canPlay,
}: VideoPosterOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ${
        canPlay ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Image
        src={getProxiedUrl(poster)}
        alt={alt}
        width={width}
        height={height}
        priority={effectivePosterPriority}
        loading={shouldLoadPosterEagerly ? 'eager' : 'lazy'}
        fetchPriority={effectivePosterPriority ? 'high' : 'auto'}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={className || 'h-full w-full object-cover'}
        placeholder="blur"
        blurDataURL={blurDataURL || generateBlurDataURL()}
        quality={quality || 75}
        style={{
          objectFit: objectFit,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
