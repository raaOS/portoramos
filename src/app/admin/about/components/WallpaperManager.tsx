import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Check, Trash2, Loader2, Pencil, Play } from 'lucide-react';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import type { UploadedAsset } from '@/app/admin/components/file-upload/types';
import { WallpaperConfig, Wallpaper } from '@/types/about';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { extractStoragePath, isVideoLink } from '@/lib/media';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { readVideoDimensions, checkMinResolution } from '@/lib/videoMeta';

interface WallpaperManagerProps {
  data?: WallpaperConfig;
  onUpdate: (data: WallpaperConfig) => void;
  /**
   * True selama fetch awal `/api/about` belum selesai (atau saat React
   * Query masih menampilkan placeholder synthetic). Saat ini WallpaperManager
   * menampilkan skeleton, bukan langsung render `data` yang isinya fallback
   * dari `src/data/about.json` (yang sering tidak sinkron dengan D1).
   *
   * Tanpa flag ini, user pertama kali masuk halaman akan melihat satu
   * wallpaper dummy dari fallback lokal, lalu baru-baru kemudian wallpaper
   * dari D1 muncul — yang membuat tampilan kosong/aneh sebelum refresh.
   */
  isLoading?: boolean;
}

// Width target untuk preview card di admin grid (2 kolom @ aspect-video di
// container ~1200px). Pakai 800px sebagai upper bound supaya 2x DPI tetap
// tajam tanpa harus download asset 2K.
const PREVIEW_WIDTH = 800;
const PREVIEW_HEIGHT = 450;

/**
 * Untuk URL Unsplash kita inject query param `w` dan `q` agar CDN-nya melayani
 * versi yang lebih kecil. Ini menghemat MB per card vs. download full-res
 * (mis. `?w=2070`) yang sebelumnya selalu ditarik penuh ke kartu kecil ini.
 */
function buildOptimizedUrl(url: string): string {
  if (!url) return url;
  const isUnsplash = url.includes('images.unsplash.com') || url.includes('plus.unsplash.com');
  if (!isUnsplash) return url;

  try {
    const u = new URL(url);
    u.searchParams.set('w', String(PREVIEW_WIDTH));
    u.searchParams.set('q', '70');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

export default function WallpaperManager({
  data,
  onUpdate,
  isLoading = false,
}: WallpaperManagerProps) {
  const { csrfToken } = useAdminAuth();
  const { confirm } = useConfirm();
  // No more hard-coded "default"/"minimal" wallpapers. The collection starts
  // empty; the public site has its own DEFAULT_WALLPAPER_URL fallback baked
  // into the bundle (see `os/utils/zIndexLayers.ts`), so visitors always see
  // *something* even when this list is empty.
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  // Local state for blur — only saves to database on pointer/mouse up (not every keystroke)
  const [blurValue, setBlurValue] = useState<number>(data?.blur || 0);
  const [isUploading, setIsUploading] = useState(false);
  // Track wallpaper card mana yang user hover/active untuk lazy-play video.
  // Tanpa ini semua video di-autoplay → bandwidth habis & preview gambar
  // lain ikut antri.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Rename UI state. `renamingId` toggles a card into edit mode and
  // `renameDraft` is the in-progress text. We commit on Enter / blur and
  // revert on Escape so accidental clicks don't wipe a name.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Sync state with props in render
  const [lastData, setLastData] = useState(data);
  if (data && data !== lastData) {
    if (data.collection && data.collection.length > 0) {
      setWallpapers(data.collection);
      setActiveId(data.activeWallpaperId || data.collection[0].id);
    } else {
      setWallpapers([]);
      setActiveId('');
    }
    // Sync local blur value when external data changes (e.g. initial load)
    setBlurValue(data.blur ?? 0);
    setLastData(data);
  }

  const handleUpload = (assets: UploadedAsset[]) => {
    if (!assets || assets.length === 0) return;

    const newWallpapers: Wallpaper[] = assets.map((asset) => ({
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: asset.url,
      // Persist poster JPG when the upload was a video so the admin
      // grid (and any downstream UI) can show a thumbnail without
      // decoding the MP4. For images this is left undefined.
      posterUrl: asset.posterUrl,
      name: 'Custom Wallpaper',
    }));

    const newCollection = [...wallpapers, ...newWallpapers];
    setWallpapers(newCollection);
    // Auto-select the first new wallpaper
    const newActiveId = newWallpapers[0].id;
    setActiveId(newActiveId);

    onUpdate({
      activeWallpaperId: newActiveId,
      collection: newCollection,
      blur: data?.blur,
    });
  };

  /**
   * Validasi pre-upload khusus wallpaper.
   *
   * Untuk video: enforce resolusi minimum 1920x1080 supaya saat tampil
   * fullscreen sebagai wallpaper desktop, browser tidak harus upsample
   * (yang bikin frame pecah). Image: tidak divalidasi di sini karena
   * pipeline upload sudah re-encode dan resize via sharp.
   */
  const validateWallpaperFiles = useCallback(async (files: File[]): Promise<string | null> => {
    for (const file of files) {
      if (!file.type.startsWith('video/')) continue;
      try {
        const dim = await readVideoDimensions(file);
        const check = checkMinResolution(dim, 1920, 1080);
        if (!check.ok) {
          return (
            `Video "${file.name}" beresolusi ${check.width}x${check.height}. ` +
            `Wallpaper video minimal 1920x1080 supaya tampilan tidak pecah ` +
            `saat di-fullscreen. Silakan upload versi resolusi lebih tinggi.`
          );
        }
      } catch (err) {
        console.error('validateWallpaperFiles: gagal baca metadata', err);
        return (
          `Tidak bisa membaca metadata video "${file.name}". ` +
          `Pastikan file tidak rusak dan formatnya MP4/WebM.`
        );
      }
    }
    return null;
  }, []);

  const handleDelete = async (id: string) => {
    const wallpaperToDelete = wallpapers.find((w) => w.id === id);

    const storagePath = wallpaperToDelete ? extractStoragePath(wallpaperToDelete.url) : null;
    if (wallpaperToDelete && storagePath) {
      const confirmDelete = await confirm({
        title: 'Hapus wallpaper ini?',
        message:
          'File akan dihapus permanen dari Storage (termasuk poster ' +
          'dan preview untuk video). Aksi ini tidak bisa di-undo.',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        tone: 'danger',
      });

      if (confirmDelete) {
        // Build the list of side-car files we generated for this asset.
        // For video wallpapers the upload pipeline writes a `-preview.mp4`
        // and a `.jpg` poster next to the main file; clean them up so
        // the bucket does not accumulate orphans.
        const candidatePaths = new Set<string>();
        candidatePaths.add(storagePath);
        if (isVideoLink(wallpaperToDelete.url)) {
          const base = storagePath.replace(/\.(mp4|webm|mov)$/i, '');
          candidatePaths.add(`${base}-preview.mp4`);
          candidatePaths.add(`${base}.jpg`);
        }
        const posterPath = wallpaperToDelete.posterUrl
          ? extractStoragePath(wallpaperToDelete.posterUrl)
          : null;
        if (posterPath) candidatePaths.add(posterPath);

        try {
          await Promise.all(
            Array.from(candidatePaths).map((path) =>
              fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'x-csrf-token': csrfToken || '' },
              }).catch(() => null)
            )
          );
        } catch (e) {
          console.error('Failed to delete physical wallpaper file', e);
        }
      } else {
        return; // User cancelled
      }
    }

    const newCollection = wallpapers.filter((w) => w.id !== id);
    setWallpapers(newCollection);
    // If the active wallpaper was deleted, fall back to the first remaining
    // entry, or empty string when the list becomes empty (the public site
    // resolves that to its own bundled DEFAULT_WALLPAPER_URL).
    let newActive = activeId;
    if (activeId === id) {
      newActive = newCollection[0]?.id || '';
      setActiveId(newActive);
    }
    onUpdate({
      activeWallpaperId: newActive,
      collection: newCollection,
      blur: data?.blur,
    });
  };

  const handleSetActive = (id: string) => {
    // Don't apply a wallpaper accidentally while the user is editing its
    // name; the click target is the same card.
    if (renamingId === id) return;
    setActiveId(id);
    onUpdate({
      activeWallpaperId: id,
      collection: wallpapers,
      blur: data?.blur,
    });
  };

  const startRename = (wp: Wallpaper) => {
    setRenamingId(wp.id);
    setRenameDraft(wp.name || '');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const commitRename = (id: string) => {
    const trimmed = renameDraft.trim();
    const fallback = 'Custom Wallpaper';
    const nextName = trimmed.length > 0 ? trimmed.slice(0, 200) : fallback;

    // Skip the round-trip if the name didn't actually change.
    const current = wallpapers.find((w) => w.id === id);
    if (!current || current.name === nextName) {
      cancelRename();
      return;
    }

    const newCollection = wallpapers.map((w) => (w.id === id ? { ...w, name: nextName } : w));
    setWallpapers(newCollection);
    cancelRename();

    onUpdate({
      activeWallpaperId: activeId,
      collection: newCollection,
      blur: data?.blur,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">Desktop Wallpaper</h3>
        <p className="mb-6 text-sm text-gray-600">
          Pilih wallpaper utama sistem. Klik untuk menerapkan (Auto-Save).
        </p>

        {isLoading ? (
          // Loading state: tampilkan skeleton card supaya user tidak
          // melihat slot "Upload New" sendirian (yang terlihat seperti
          // koleksi kosong) sebelum data dari D1 selesai dimuat.
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="aspect-video animate-pulse rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-200"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Blur Intensity (0-20px)
                </label>
                <span className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-sm text-gray-600">
                  {blurValue}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={blurValue}
                onChange={(e) => setBlurValue(parseInt(e.target.value))}
                onPointerUp={(e) =>
                  onUpdate({
                    ...data!,
                    collection: wallpapers,
                    activeWallpaperId: activeId,
                    blur: parseInt((e.target as HTMLInputElement).value),
                  })
                }
                onMouseUp={(e) =>
                  onUpdate({
                    ...data!,
                    collection: wallpapers,
                    activeWallpaperId: activeId,
                    blur: parseInt((e.target as HTMLInputElement).value),
                  })
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
              />
              <p className="mt-2 text-xs text-gray-500">
                Geser untuk mengatur tingkat keburaman wallpaper desktop. 0 = Tajam.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Active Wallpaper Hero (Optional Visual Emphasis) */}

              {wallpapers.map((wp, index) => (
                <WallpaperCard
                  key={wp.id}
                  wp={wp}
                  isActive={activeId === wp.id}
                  isHovered={hoveredId === wp.id}
                  isRenaming={renamingId === wp.id}
                  renameDraft={renameDraft}
                  renameInputRef={renameInputRef}
                  // Pertama tampil di viewport: prioritize. Sisanya
                  // lazy load oleh next/image otomatis.
                  priority={index === 0}
                  onSelect={() => handleSetActive(wp.id)}
                  onMouseEnter={() => setHoveredId(wp.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === wp.id ? null : prev))}
                  onStartRename={() => startRename(wp)}
                  onRenameDraftChange={setRenameDraft}
                  onCommitRename={() => commitRename(wp.id)}
                  onCancelRename={cancelRename}
                  onDelete={() => handleDelete(wp.id)}
                />
              ))}

              {/* Clean Upload Area */}
              <div
                className={`border-3 relative aspect-video rounded-2xl border-dashed ${isUploading ? 'border-amber-400 bg-amber-50/20' : 'border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/10'} group flex flex-col items-center justify-center gap-4 overflow-hidden transition-all`}
              >
                <div
                  className={`pointer-events-none rounded-full p-4 text-blue-500 shadow-sm transition-transform ${isUploading ? 'bg-amber-50' : 'bg-white group-hover:scale-110'}`}
                >
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                  ) : (
                    <Plus size={32} />
                  )}
                </div>
                <div className="pointer-events-none text-center">
                  <h4 className="font-semibold text-gray-700">
                    {isUploading ? 'Mengupload...' : 'Upload New'}
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    {isUploading ? 'Harap tunggu...' : 'Image atau video. Video min. 1920x1080.'}
                  </p>
                </div>
                {/* Keep the uploader mounted while processing so its
                            internal progress state can render over the card. */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 [&>div>div[role=button]]:h-full [&>div]:h-full ${
                    isUploading
                      ? 'pointer-events-none bg-white/95 p-4 opacity-100 backdrop-blur-sm'
                      : 'opacity-0'
                  }`}
                >
                  <AdminFileUpload
                    folder="wallpapers"
                    accept="image/*,video/mp4,video/webm"
                    disabled={isUploading}
                    className="flex h-full items-center justify-center"
                    onUpload={() => {
                      /* handled via onUploadResult */
                    }}
                    onUploadResult={handleUpload}
                    onUploadStart={() => setIsUploading(true)}
                    onUploadEnd={() => setIsUploading(false)}
                    customValidator={validateWallpaperFiles}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Subcomponent: WallpaperCard ----------

interface WallpaperCardProps {
  wp: Wallpaper;
  isActive: boolean;
  isHovered: boolean;
  isRenaming: boolean;
  renameDraft: string;
  renameInputRef: React.MutableRefObject<HTMLInputElement | null>;
  priority: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onStartRename: () => void;
  onRenameDraftChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

function WallpaperCard({
  wp,
  isActive,
  isHovered,
  isRenaming,
  renameDraft,
  renameInputRef,
  priority,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onStartRename,
  onRenameDraftChange,
  onCommitRename,
  onCancelRename,
  onDelete,
}: WallpaperCardProps) {
  const isVideo = useMemo(() => isVideoLink(wp.url), [wp.url]);
  // Click-to-play: video hanya start saat user hover atau wallpaper aktif.
  // Idle state cuma render poster (kalau ada) atau frame pertama lewat
  // <img>. Tanpa ini semua video preload metadata + autoplay → bandwidth.
  const shouldPlayVideo = isVideo && (isHovered || isActive);

  const optimizedImageSrc = useMemo(() => buildOptimizedUrl(wp.url), [wp.url]);
  const optimizedPosterSrc = useMemo(
    () => (wp.posterUrl ? buildOptimizedUrl(wp.posterUrl) : null),
    [wp.posterUrl]
  );

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative aspect-video cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
        isActive
          ? 'scale-[1.02] shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500'
          : 'ring-1 ring-gray-200 hover:-translate-y-1 hover:shadow-xl'
      } `}
    >
      {isVideo ? (
        shouldPlayVideo ? (
          <video
            // hanya muncul saat hover/active → preload metadata di
            // titik ini sudah OK karena user benar-benar mau lihat
            src={wp.url}
            poster={optimizedPosterSrc || undefined}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <>
            {optimizedPosterSrc ? (
              // Poster jpg yang dihasilkan saat upload — ringan,
              // dilewatkan ke next/image agar di-resize ke ukuran
              // card.
              <Image
                src={optimizedPosterSrc}
                alt={wp.name || 'Wallpaper preview'}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                quality={70}
                priority={priority}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              // Tidak ada poster → fallback placeholder gelap +
              // tombol play, biar tidak men-download MP4 untuk
              // sekedar thumbnail.
              <div className="flex h-full w-full items-center justify-center bg-gray-900">
                <Play size={32} className="text-white/70" />
              </div>
            )}
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              <Play size={10} /> Video
            </div>
          </>
        )
      ) : (
        <Image
          src={optimizedImageSrc}
          alt={wp.name || 'Wallpaper preview'}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          quality={70}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Active Badge */}
      <div
        className={`absolute right-4 top-4 rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-0'}`}
      >
        <Check size={16} strokeWidth={3} />
      </div>

      {/* Overlay & Info */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 ${isActive || isRenaming ? 'opacity-100' : ''}`}
      >
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameDraft}
            maxLength={200}
            onChange={(e) => onRenameDraftChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCommitRename();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancelRename();
              }
            }}
            onBlur={onCommitRename}
            placeholder="Wallpaper name"
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white placeholder-white/50 drop-shadow-md backdrop-blur-md focus:border-white focus:outline-none"
          />
        ) : (
          <>
            <p className="translate-y-2 transform text-lg font-medium text-white drop-shadow-md transition-transform group-hover:translate-y-0">
              {isActive ? 'Active Wallpaper' : wp.name || 'Wallpaper'}
            </p>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/80">
              {isActive ? 'Applied' : 'Click to Apply'}
            </span>
          </>
        )}
      </div>

      {/* Edit & Delete Actions */}
      {!isRenaming && (
        <div className="absolute left-4 top-4 flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-blue-500 hover:text-white"
            title="Rename Wallpaper"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-red-500 hover:text-white"
            title="Delete Wallpaper"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// Helper kept exported in case other admin components later need the same
// CDN-resize trick (mis. Notifications avatars).
export { buildOptimizedUrl, PREVIEW_WIDTH, PREVIEW_HEIGHT };
