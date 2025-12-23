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
    const url = new URL(s)
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

function cloudinaryVideo(u: string) {
  u = (u || '').trim()
  // Normalize embed player URL to direct video asset first
  u = fromPlayerToAsset(u)
  // Jangan tambahkan transform video (menghindari Strict Transformations)
  return u
}

function cloudinaryPosterFromVideo(u: string) {
  u = (u || '').trim()
  try {
    // Normalize embed URL first
    u = fromPlayerToAsset(u)
    const url = new URL(u)
    if (!isCloudinary(url)) return undefined
    // Keep resource as video, request jpg thumbnail at start (so_0) with optimization
    const withSo = insertCloudinaryTransform(u, 'so_0,w_800,f_auto,q_auto')
    // Change extension to .jpg
    const jpg = withSo.replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg$2')
    return jpg
  } catch {
    return undefined
  }
}

const BLANK_SVG = `data:image/svg+xml;utf8,` +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="100%" height="100%" fill="#f2f2f2"/></svg>')

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
      const v = cloudinaryVideo(p.cover)
      const poster = cloudinaryPosterFromVideo(p.cover)
      return { kind, src: toMediaProxy(v), poster: poster ? toImageProxy(poster) : undefined, width: p.coverWidth, height: p.coverHeight }
    }
    const img = cloudinaryImage(p.cover, { width: 1600 })
    return { kind: 'image', src: toImageProxy(img), width: p.coverWidth, height: p.coverHeight }
  }
  // Tanpa cover: kembalikan placeholder lokal (bukan Picsum)
  return { kind: 'image', src: coverUrl(p) }
}

export function resolveGallery(p: Project): GalleryItem[] {
  if (p.galleryItems && p.galleryItems.length) {
    return p.galleryItems
      .filter((it) => it.isActive !== false)
      .map((it) => {
        if (it.kind === 'video') {
          const v = cloudinaryVideo(it.src)
          const poster = it.poster ? cloudinaryImage(it.poster) : cloudinaryPosterFromVideo(it.src)
          return { kind: 'video', src: toMediaProxy(v), poster: poster ? toImageProxy(poster) : undefined, width: it.width, height: it.height }
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
