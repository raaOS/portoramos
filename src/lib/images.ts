// MediaItem removed
import type { Project, GalleryItem } from '@/types/projects'

function toProxy(u: string) {
  u = (u || '').trim()
  return u
}

export function toImageProxy(u: string) {
  u = (u || '').trim()
  return u
}

export function toMediaProxy(u: string) {
  u = (u || '').trim()
  return u
}

function isCloudinary(url: URL) {
  return url.hostname === 'res.cloudinary.com'
}

function fromPlayerToAsset(u: string) {
  // Convert Cloudinary Player embed URL to direct asset URL (mp4)
  try {
    const url = new URL(u)
    if (url.hostname !== 'player.cloudinary.com') return u
    const cloud = url.searchParams.get('cloud_name')
    const publicId = url.searchParams.get('public_id')
    if (cloud && publicId) {
      // Note: public_id may contain folders, keep as-is
      return `https://res.cloudinary.com/${cloud}/video/upload/${publicId}.mp4`
    }
    return u
  } catch { return u }
}

function insertCloudinaryTransform(u: string, transform: string) {
  u = (u || '').trim()
  try {
    const url = new URL(u)
    if (!isCloudinary(url)) return u
    // Cloudinary pattern: /<cloud>/<resource>/upload/(optional transforms/)(optional version/)<public_id>.<ext>
    const parts = url.pathname.split('/')
    const uploadIdx = parts.findIndex(p => p === 'upload')
    if (uploadIdx === -1) return u
    // Insert transform right after 'upload'. If a transform already exists, prepend ours.
    // Ensure not to duplicate commas/slashes
    const afterUpload = parts[uploadIdx + 1] || ''
    const hasExistingTransform = afterUpload && !afterUpload.startsWith('v') && afterUpload.indexOf('.') === -1
    if (hasExistingTransform) {
      parts[uploadIdx + 1] = `${transform},${parts[uploadIdx + 1]}`
    } else {
      parts.splice(uploadIdx + 1, 0, transform)
    }
    url.pathname = parts.join('/')
    return url.toString()
  } catch {
    return u
  }
}

export function isVideoLink(u: string): boolean {
  try {
    const s = (u || '').trim()
    if (!s) return false
    // Use a dummy base to handle relative paths (e.g. /assets/media/...)
    const url = new URL(s, 'https://example.com')
    if (url.hostname === 'player.cloudinary.com') return true
    if (url.hostname === 'res.cloudinary.com') {
      // Check if it's a video resource in Cloudinary
      const p = url.pathname.toLowerCase()
      return p.includes('/video/') || p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.webm')
    }
    const p = url.pathname.toLowerCase()
    return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.webm')
  } catch { return false }
}

function cloudinaryImage(u: string, opts?: { width?: number }) {
  const w = opts?.width ? `,w_${opts.width}` : ''
  // f_auto,q_auto plus optional width
  return insertCloudinaryTransform(u, `f_auto,q_auto${w}`)
}

function cloudinaryVideo(u: string, opts?: { width?: number, quality?: string }) {
  u = (u || '').trim()
  // Normalize embed player URL to direct video asset first
  u = fromPlayerToAsset(u)

  const w = opts?.width ? `,w_${opts.width}` : ''
  const q = opts?.quality ? `,q_auto:${opts.quality}` : ',q_auto'
  // vc_auto (video codec auto) + quality + width
  return insertCloudinaryTransform(u, `vc_auto${q}${w}`)
}

function cloudinaryPosterFromVideo(u: string, opts?: { width?: number }) {
  u = (u || '').trim()
  if (u.startsWith('/')) {
    // For local videos, we can't auto-generate a poster easily without a server.
    // Return the video URL itself or a generic placeholder if needed.
    // Most browsers will show the first frame if poster is missing.
    return undefined
  }
  try {
    // Normalize embed URL first
    u = fromPlayerToAsset(u)
    const url = new URL(u)
    if (!isCloudinary(url)) return undefined

    // Default poster width for video thumbnails - 250px matches grid display
    const w = opts?.width ? opts.width : 250
    // Keep resource as video, request jpg thumbnail at start (so_0) with optimization
    const withSo = insertCloudinaryTransform(u, `so_0,w_${w},f_auto,q_auto`)
    // Change extension to .webp for better compression and audit compliance
    const webp = withSo.replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.webp$2')
    return webp
  } catch {
    return undefined
  }
}

const BLANK_SVG = `data:image/svg+xml;utf8,` +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9ca3af">PREVIEW</text></svg>')

export function coverUrl(_p: Project) {
  // Tidak pakai Picsum; gunakan placeholder lokal data URI
  return BLANK_SVG
}

export function galleryUrls(p: Project) {
  const count = (p.gallery && p.gallery.length) || 0
  const arr = new Array(Math.max(count, 3)).fill(0).map((_, i) => i)
  return arr.map((i) => toProxy(`https://picsum.photos/seed/${encodeURIComponent(p.slug)}-${i}/1600/1000.jpg`))
}

export function resolveCover(p: Project): GalleryItem {
  const inferredVideo = isVideoLink(p.cover)
  const kind = (inferredVideo ? 'video' : 'image') as GalleryItem['kind']
  if (p.cover) {
    if (inferredVideo) {
      if (isCloudinary(new URL(p.cover, 'https://example.com'))) {
        // Grid video: Upgrade to HD (720p) for better clarity
        const v = cloudinaryVideo(p.cover, { width: 720 }) // Removed quality: 'eco'
        const poster = cloudinaryPosterFromVideo(p.cover, { width: 720 })
        return { kind, src: toMediaProxy(v), poster: poster ? toImageProxy(poster) : undefined, width: p.coverWidth, height: p.coverHeight }
      } else {
        // Local video: Try to guess poster path convention [slug]-cover.jpg or use video as is 
        // Note: We cannot verify file existence here safely without node fs.
        // Best bet: Return undefined for poster.
        // Media.tsx will now handle "no poster" by showing the native video element (first frame).
        // This avoids the "White Box" issue caused by BLANK_SVG overlay.
        return { kind, src: toMediaProxy(p.cover), poster: undefined, width: p.coverWidth, height: p.coverHeight }
      }
    }
    // Grid images: 800px for sharp Retina display (2x density)
    const img = cloudinaryImage(p.cover, { width: 800 })
    return { kind: 'image', src: toImageProxy(img), width: p.coverWidth, height: p.coverHeight }
  }
  // Tanpa cover: kembalikan placeholder lokal (bukan Picsum)
  return { kind: 'image', src: coverUrl(p) }
}

export function resolveDetailCover(p: Project): GalleryItem {
  const inferredVideo = isVideoLink(p.cover)
  const kind = (inferredVideo ? 'video' : 'image') as GalleryItem['kind']
  if (p.cover) {
    if (inferredVideo) {
      if (isCloudinary(new URL(p.cover, 'https://example.com'))) {
        // Detail video: High Quality (w=1280) for hero display
        // Standard q_auto to ensure good visual quality
        const v = cloudinaryVideo(p.cover, { width: 1280 })
        const poster = cloudinaryPosterFromVideo(p.cover, { width: 1280 })
        return { kind, src: toMediaProxy(v), poster: poster ? toImageProxy(poster) : undefined, width: p.coverWidth, height: p.coverHeight }
      } else {
        // Local video fallback
        return { kind, src: toMediaProxy(p.cover), poster: BLANK_SVG, width: p.coverWidth, height: p.coverHeight }
      }
    }
    // Detail images: 1600px for full hero quality
    const img = cloudinaryImage(p.cover, { width: 1600 })
    return { kind: 'image', src: toImageProxy(img), width: p.coverWidth, height: p.coverHeight }
  }
  return { kind: 'image', src: coverUrl(p) }
}

export function resolveGallery(p: Project): GalleryItem[] {
  if (p.galleryItems && p.galleryItems.length) {
    return p.galleryItems
      .filter((it) => it.isActive !== false)
      .map((it) => {
        if (it.kind === 'video') {
          if (isCloudinary(new URL(it.src, 'https://example.com'))) {
            // Gallery video: Higher quality (w=1600, standard q_auto)
            const v = cloudinaryVideo(it.src, { width: 1600 })
            const poster = it.poster ? cloudinaryImage(it.poster) : cloudinaryPosterFromVideo(it.src)
            return { kind: 'video', src: toMediaProxy(v), poster: poster ? toImageProxy(poster) : undefined, width: it.width, height: it.height }
          } else {
            // Local Gallery Video Fallback
            return { kind: 'video', src: toMediaProxy(it.src), poster: it.poster ? toImageProxy(it.poster) : BLANK_SVG, width: it.width, height: it.height }
          }
        }
        const img = cloudinaryImage(it.src, { width: 1600 })
        return { kind: 'image', src: toImageProxy(img), width: it.width, height: it.height }
      })
  }
  const basic = (p.gallery || []).map((src) => {
    const img = cloudinaryImage(src, { width: 1600 })
    return { kind: 'image', src: toImageProxy(img) } as GalleryItem
  })
  if (basic.length) return basic
  // Jika tidak ada gallery sama sekali, jangan pakai placeholder Picsum
  // Kembalikan kosong agar UI tidak memuat placeholder eksternal
  return []
}
