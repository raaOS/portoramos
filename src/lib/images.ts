// [STICKY NOTE] IMAGES UTILITY
// File ini sekarang bersih dari Cloudinary.
// Fungsi utamanya hanya memastikan URL valid (trimming) dan mengembalikan URL asli (Raw).
// Karena kita pakai GitHub Storage, tidak ada transformasi/kompresi otomatis.

import type { Project, GalleryItem } from '@/types/projects';

function toProxy(u: string) {
  return (u || '').trim();
}

export function toImageProxy(u: string) {
  return (u || '').trim();
}

export function toMediaProxy(u: string) {
  return (u || '').trim();
}

export function isVideoLink(u: string): boolean {
  try {
    const s = (u || '').trim();
    if (!s) return false;
    const url = new URL(s, 'https://example.com');
    const p = url.pathname.toLowerCase();
    return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.webm');
  } catch { return false; }
}

const BLANK_SVG = `data:image/svg+xml;utf8,` +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9ca3af">PREVIEW</text></svg>');

export function coverUrl(_p: Project) {
  return BLANK_SVG;
}

export function galleryUrls(p: Project) {
  const count = (p.gallery && p.gallery.length) || 0;
  // Fallback to Picsum placeholders if gallery exists but URLs are constructed
  // Note: This function seems rarely used in current logic, mostly resolveGallery is used
  const arr = new Array(Math.max(count, 3)).fill(0).map((_, i) => i);
  return arr.map((i) => toProxy(`https://picsum.photos/seed/${encodeURIComponent(p.slug)}-${i}/1600/1000.jpg`));
}

export function resolveCover(p: Project): GalleryItem {
  const inferredVideo = isVideoLink(p.cover);
  const kind = (inferredVideo ? 'video' : 'image') as GalleryItem['kind'];

  if (p.cover) {
    // Return RAW URL (Local or GitHub)
    return {
      kind,
      src: toMediaProxy(p.cover),
      poster: undefined, // Browser will show first frame for video
      width: p.coverWidth,
      height: p.coverHeight
    };
  }

  return { kind: 'image', src: coverUrl(p) };
}

export function resolveDetailCover(p: Project): GalleryItem {
  // Same logic as resolveCover, just separate function for logical separation if needed later
  return resolveCover(p);
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
