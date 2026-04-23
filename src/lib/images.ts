// [STICKY NOTE] IMAGES UTILITY
// File ini mengelola aset gambar dan media untuk portofolio.

import type { Project, GalleryItem } from '@/types/projects';
import { resolveStorageUrl } from '@/lib/urlResolver';
import { getVideoPosterSource, getVideoPreviewSource, isVideoSource } from '@/lib/mediaPreview';

export function toImageProxy(u: string) {
  return resolveStorageUrl(u);
}

export function toMediaProxy(u: string) {
  return resolveStorageUrl(u);
}

export function isVideoLink(u: string): boolean {
  return isVideoSource((u || '').trim());
}

const BLANK_SVG = `data:image/svg+xml;utf8,` +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9ca3af">PREVIEW</text></svg>');

export function coverUrl(p: Project) {
  return p.cover ? toMediaProxy(p.cover) : BLANK_SVG;
}


function resolveCoverWithSource(p: Project, src: string): GalleryItem {
  const inferredVideo = isVideoLink(src);
  const kind = (inferredVideo ? 'video' : 'image') as GalleryItem['kind'];

  if (src) {
    const posterUrl = inferredVideo ? getVideoPosterSource(p.cover) : undefined;
    return {
      kind,
      src: toMediaProxy(src),
      poster: posterUrl ? toImageProxy(posterUrl) : undefined,
      width: p.coverWidth,
      height: p.coverHeight
    };
  }

  return { kind: 'image', src: coverUrl(p) };
}

export function resolveCover(p: Project): GalleryItem {
  return resolveCoverWithSource(p, p.cover);
}

export function resolvePreviewCover(p: Project): GalleryItem {
  return resolveCoverWithSource(p, getVideoPreviewSource(p.cover));
}


export function resolveGallery(p: Project): GalleryItem[] {
  if (p.galleryItems && p.galleryItems.length) {
    return p.galleryItems
      .filter((it) => it.isActive !== false)
      .map((it) => {
        // Return RAW URL
        return {
          kind: it.kind,
          src: toMediaProxy(it.src),
          poster: it.poster ? toImageProxy(it.poster) : undefined,
          width: it.width,
          height: it.height
        };
      });
  }

  const basic = (p.gallery || []).map((src) => {
    return { kind: 'image', src: toImageProxy(src) } as GalleryItem;
  });

  if (basic.length) return basic;
  return [];
}
