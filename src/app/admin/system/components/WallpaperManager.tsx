import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Check, Trash2, Loader2, Pencil, Play } from 'lucide-react';
import { WallpaperConfig, Wallpaper } from '@/types/about';
import type { AboutData } from '@/types/about';
import { useBackgroundUpload, type WallpaperUploadProfile } from '@/contexts/BackgroundUploadContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useQueryClient } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '@/app/admin/lib/adminQueries';
import { mutate as swrMutate } from 'swr';
import { extractStoragePath, isVideoLink, detectImageDimensions } from '@/lib/media';
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

// Hard ceiling untuk file wallpaper. Match dengan
// `MAX_CLIENT_COMPRESS_SIZE` di BackgroundUploadContext supaya validation
// admin-side dan compress-side konsisten. Live wallpaper 4K dari source
// internet tipikal 30-50 MB, jadi 60 MB cukup longgar untuk pass-through
// Ultra; di sisi lain mencegah upload 100+ MB raw export yang merusak
// Lighthouse LCP visitor mobile.
const MAX_WALLPAPER_FILE_SIZE = 60 * 1024 * 1024;

// Persisted toggle: admin pilih sekali, apply untuk semua upload sampai
// mereka ubah lagi. Simpan di sessionStorage (bukan localStorage) supaya:
//   1. Pilihan bertahan di tab yang sama (admin tidak harus re-pick
//      tiap kali pindah halaman).
//   2. Tab baru / browser restart = preference fresh — penting di
//      shared computer (kantor) supaya admin lain tidak warisan
//      pilihan dari sesi sebelumnya.
//
// Default: 'high' (1440p) — sweet spot untuk monitor 1080p / 24" QHD.
const PROFILE_STORAGE_KEY = 'admin.wallpaper-upload-profile';
const VALID_PROFILES: readonly WallpaperUploadProfile[] = ['high', 'ultra'] as const;

function readStoredProfile(): WallpaperUploadProfile {
  if (typeof window === 'undefined') return 'high';
  try {
    const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw && (VALID_PROFILES as readonly string[]).includes(raw)) {
      return raw as WallpaperUploadProfile;
    }
  } catch {
    // Quota / disabled storage → fallback default.
  }
  return 'high';
}

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
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(data?.collection || []);
  const [activeId, setActiveId] = useState<string>(data?.activeWallpaperId || (data?.collection?.[0]?.id ?? ''));
  // Local state for blur — only saves to database on pointer/mouse up (not every keystroke)
  const [blurValue, setBlurValue] = useState<number>(data?.blur || 0);
  // Encode profile untuk wallpaper upload. Persisted di localStorage
  // supaya pilihan admin (mis. monitor 4K → Ultra) bertahan lintas
  // session. Default: 'high' (1440p).
  const [uploadProfile, setUploadProfile] = useState<WallpaperUploadProfile>(() =>
    readStoredProfile()
  );
  const handleProfileChange = useCallback((next: WallpaperUploadProfile) => {
    setUploadProfile(next);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PROFILE_STORAGE_KEY, next);
      }
    } catch {
      // Quota / private mode — preference cuma berlaku untuk session ini.
    }
  }, []);
  const { enqueueWallpaperUpload, hasActiveUploads } = useBackgroundUpload();
  
  // Track wallpaper card mana yang user hover/active untuk lazy-play video.
  // Tanpa ini semua video di-autoplay → bandwidth habis & preview gambar
  // lain ikut antri.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Sync local state from props using the React-recommended
  // derived-state-during-render pattern.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  //
  // Pakai `lastData` marker untuk mendeteksi identity change pada
  // `data`. Ketika React Query mengubah snapshot (mis. setelah upload
  // baru selesai), reference berubah → kita re-sync local state ke
  // value baru, lalu update marker. Ini SATU render extra per
  // perubahan eksternal, bukan loop.
  //
  // Catatan: jangan pindahkan ke useEffect — react-hooks v6+ rule
  // `set-state-in-effect` melarang setState di dalam effect untuk
  // kasus sync-from-props seperti ini.
  const [lastData, setLastData] = useState(data);
  if (data && data !== lastData) {
    if (data.collection && data.collection.length > 0) {
      setWallpapers(data.collection);
      setActiveId(data.activeWallpaperId || data.collection[0].id);
    } else {
      setWallpapers([]);
      setActiveId('');
    }
    setBlurValue(data.blur ?? 0);
    setLastData(data);
  }

  // ── Self-healing posterUrl backfill ─────────────────────────────
  //
  // Why this is here:
  //   Older wallpaper entries (pre-poster-field, restored backups,
  //   or legacy `.webp` poster era) often have `posterUrl` undefined
  //   in D1. At runtime, `DesktopBackground` works around that by
  //   probing `<base>.jpg` then `<base>.webp` — costs one 404 RTT
  //   per cold load when the answer is `.webp`.
  //
  //   Rather than ask the user to remember running a CLI script, we
  //   trigger the backfill transparently when they open the
  //   appearance panel. The endpoint is admin-only, idempotent, and
  //   no-op when nothing needs healing — so calling it on every
  //   panel mount is cheap. Effect deps tied to the actual collection
  //   shape so re-runs only happen when the data they would inspect
  //   actually changed.
  //
  //   Failure mode: any error is swallowed. We never block the UI
  //   on this; the user can still manage wallpapers normally even
  //   if the backfill HTTP call fails.
  const queryClient = useQueryClient();
  // Fingerprint = entries that would be candidates for backfill.
  // If none is missing posterUrl, the value collapses to '' and the
  // effect's dependency stays stable across re-renders.
  //
  // Computed inline (no useMemo) because the React Compiler
  // optimizes plain reads automatically and the lint rule
  // `react-hooks/preserve-manual-memoization` rejects manual memo
  // for derived values like this.
  const collectionFingerprint = (data?.collection || [])
    .filter((w) => !w.posterUrl && w.url)
    .map((w) => w.id)
    .join('|');

  const lastHealedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!collectionFingerprint) return;
    if (lastHealedFingerprintRef.current === collectionFingerprint) return;

    let cancelled = false;
    const controller = new AbortController();
    lastHealedFingerprintRef.current = collectionFingerprint;

    (async () => {
      try {
        const res = await fetch('/api/admin/wallpaper-poster-backfill', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || '',
          },
          // No body — endpoint reads everything it needs from D1.
          body: '{}',
          signal: controller.signal,
        });

        if (!res.ok) {
          // Non-200: log once and bail. Don't show user-facing error
          // since this is a background self-heal, not an action they
          // initiated.
          console.warn(
            `[WallpaperManager] poster backfill returned ${res.status}, skipping`
          );
          return;
        }

        const body = (await res.json().catch(() => null)) as {
          success?: boolean;
          result?: { backfilled: number };
        } | null;

        if (cancelled) return;
        if (!body?.success) return;
        const backfilled = body.result?.backfilled ?? 0;
        if (backfilled === 0) return;

        // Endpoint wrote new posterUrl values to D1. Refresh the
        // about cache so the next render of any consumer (this
        // panel, the public site after revalidation) sees the
        // healed entries. We refetch instead of merging by hand
        // because the endpoint did not return the full new
        // AboutData snapshot.
        const refreshRes = await fetch('/api/about?fresh=true', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!refreshRes.ok) return;
        const refreshed = (await refreshRes.json()) as AboutData;
        if (cancelled) return;

        queryClient.setQueryData(ADMIN_QUERY_KEYS.about, refreshed);
        await swrMutate('/api/about', refreshed, { revalidate: false });
      } catch (e) {
        // AbortError on unmount is expected — quietly ignore.
        if ((e as { name?: string })?.name === 'AbortError') return;
        console.warn('[WallpaperManager] poster backfill self-heal failed:', e);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [collectionFingerprint, csrfToken, queryClient]);

  const handleFileDrop = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate
    const error = await validateWallpaperFiles(fileArray);
    if (error) {
      alert(error); // Alternatively use toast
      return;
    }

    // Process all files in background dengan profile yang dipilih.
    for (const file of fileArray) {
      enqueueWallpaperUpload(file, { profile: uploadProfile });
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Validasi pre-upload khusus wallpaper.
   *
   * Untuk video:
   *   - Enforce resolusi minimum 1920x1080 supaya saat tampil
   *     fullscreen sebagai wallpaper desktop, browser tidak harus
   *     upsample (yang bikin frame pecah).
   *   - Enforce ceiling 60 MB. Live wallpaper > 60 MB bikin LCP
   *     visitor mobile terjun bebas dan re-encode WASM browser bisa
   *     OOM tab. Admin diminta export ulang ke target sesuai profile
   *     dulu (1440p untuk High, 2160p untuk Ultra).
   *
   * Image: tidak divalidasi di sini karena pipeline upload sudah
   * re-encode dan resize via sharp.
   */
  /**
   * Validate semua file (video & image) sebelum di-enqueue.
   *
   * Video:
   *   - Size ≤ 60 MB (ceiling pipeline)
   *   - Min 1920×1080 (FullHD baseline)
   *
   * Image:
   *   - Size ≤ 30 MB (ceiling /api/upload route)
   *   - Min 1920×1080 (sama dengan video supaya tidak pecah saat
   *     fullscreen di display HD/4K)
   *   - Server akan auto resize ke max 3840px + transcode ke WebP q82
   *     supaya bandwidth visitor tetap hemat.
   */
  const validateWallpaperFiles = useCallback(
    async (files: File[]): Promise<string | null> => {
      const targetLabel = uploadProfile === 'ultra' ? '2160p (~30-50 MB)' : '1440p (~10-20 MB)';
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          return (
            `File "${file.name}" tipe-nya ${file.type || 'unknown'}. ` +
            `Wallpaper hanya mendukung video (mp4/webm) atau image ` +
            `(jpg/png/webp/avif/heic/heif).`
          );
        }

        if (isVideo) {
          // 1) Size ceiling video — fail fast sebelum metadata read.
          if (file.size > MAX_WALLPAPER_FILE_SIZE) {
            return (
              `Video "${file.name}" berukuran ${(file.size / 1024 / 1024).toFixed(1)} MB, ` +
              `melewati batas ${MAX_WALLPAPER_FILE_SIZE / 1024 / 1024} MB. ` +
              `Export ulang ke ${targetLabel} dulu, lalu upload lagi.`
            );
          }

          // 2) Resolusi minimum video.
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
            console.error('validateWallpaperFiles: gagal baca metadata video', err);
            return (
              `Tidak bisa membaca metadata video "${file.name}". ` +
              `Pastikan file tidak rusak dan formatnya MP4/WebM.`
            );
          }
        }

        if (isImage) {
          // 1) Size ceiling image — match server `/api/upload` MAX_IMAGE_BYTES.
          const MAX_IMAGE_SIZE = 30 * 1024 * 1024;
          if (file.size > MAX_IMAGE_SIZE) {
            return (
              `Image "${file.name}" berukuran ${(file.size / 1024 / 1024).toFixed(1)} MB, ` +
              `melewati batas ${MAX_IMAGE_SIZE / 1024 / 1024} MB. ` +
              `Compress dulu (JPEG quality 85% biasanya cukup) lalu upload lagi.`
            );
          }

          // 2) Resolusi minimum image — SKIP untuk HEIC/HEIF.
          //
          // Browser non-Safari (Chrome/Firefox di Windows/Linux) tidak
          // decode HEIC native, jadi `<img>` validation akan gagal
          // walau file-nya valid. Server-side sharp bisa decode HEIC/
          // HEIF; defer validation ke server, dan kalau resolusinya
          // di bawah minimum, server akan tolak via response 413/400
          // (saat sharp pipeline menghasilkan dimensi sub-1080).
          //
          // Untuk format yang browser support langsung (JPEG/PNG/WebP/
          // AVIF di browser modern), validate di client supaya feedback
          // instant.
          const isHeic = file.type === 'image/heic' || file.type === 'image/heif';
          if (!isHeic) {
            const objectUrl = URL.createObjectURL(file);
            try {
              const dim = await detectImageDimensions(objectUrl);
              const check = checkMinResolution(dim, 1920, 1080);
              if (!check.ok) {
                return (
                  `Image "${file.name}" beresolusi ${check.width}x${check.height}. ` +
                  `Wallpaper image minimal 1920x1080 supaya tampilan tidak pecah ` +
                  `saat di-fullscreen. Silakan upload versi resolusi lebih tinggi.`
                );
              }
            } catch (err) {
              console.error('validateWallpaperFiles: gagal baca metadata image', err);
              return (
                `Tidak bisa membaca metadata image "${file.name}". ` +
                `Pastikan file tidak rusak dan formatnya JPG/PNG/WebP/AVIF/HEIC/HEIF.`
              );
            } finally {
              URL.revokeObjectURL(objectUrl);
            }
          }
        }
      }
      return null;
    },
    [uploadProfile]
  );

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
        // and a poster (`.jpg` from server ffmpeg, atau `.webp` setelah
        // server sharp transcode di flow direct-to-R2). Untuk safety
        // tracking dua extension supaya residual lama (sebelum sharp
        // transcode) maupun upload baru sama-sama ke-cleanup.
        const candidatePaths = new Set<string>();
        candidatePaths.add(storagePath);
        if (isVideoLink(wallpaperToDelete.url)) {
          const base = storagePath.replace(/\.(mp4|webm|mov)$/i, '');
          candidatePaths.add(`${base}-preview.mp4`);
          candidatePaths.add(`${base}.jpg`);
          candidatePaths.add(`${base}.webp`);
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
                className="aspect-video animate-pulse rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-200"
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

            {/* Encode Quality Toggle */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Quality
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Kualitas encode untuk video wallpaper baru. Pilihan
                    bertahan sampai tab ini ditutup.
                  </p>
                </div>
                {hasActiveUploads && (
                  <span
                    className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-700"
                    title="Ubah profile selesai upload selesai"
                  >
                    Locked
                  </span>
                )}
              </div>
              <div
                role="radiogroup"
                aria-label="Wallpaper encode profile"
                className="grid grid-cols-2 gap-2"
              >
                {(
                  [
                    {
                      value: 'high' as WallpaperUploadProfile,
                      label: 'High',
                      sub: '1440p · CRF 18',
                      hint: 'Sweet spot untuk monitor 1080p / 24" QHD. ~10-20 MB.',
                    },
                    {
                      value: 'ultra' as WallpaperUploadProfile,
                      label: 'Ultra',
                      sub: '2160p · CRF 20',
                      hint: 'Pakai kalau target monitor 4K. ~30-50 MB.',
                    },
                  ] as const
                ).map((opt) => {
                  const isSelected = uploadProfile === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={hasActiveUploads}
                      onClick={() => handleProfileChange(opt.value)}
                      title={opt.hint}
                      className={`flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      } ${
                        hasActiveUploads
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      }`}
                    >
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wider ${
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {opt.sub}
                      </span>
                      <span className="mt-1 text-[11px] leading-snug text-gray-500">
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) handleFileDrop(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 relative aspect-video rounded-xl border-dashed cursor-pointer ${
                  hasActiveUploads 
                    ? 'border-amber-400 bg-amber-50/20' 
                    : isDragOver 
                      ? 'border-blue-500 bg-blue-50/20' 
                      : 'border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/10'
                } group flex flex-col items-center justify-center gap-4 overflow-hidden transition-all`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                  multiple
                  onChange={(e) => e.target.files && handleFileDrop(e.target.files)}
                />
                <div
                  className={`pointer-events-none rounded-full p-4 shadow-sm transition-transform ${
                    hasActiveUploads ? 'bg-amber-50 text-amber-500' : 'bg-white text-blue-500 group-hover:scale-110'
                  }`}
                >
                  {hasActiveUploads ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : (
                    <Plus size={32} />
                  )}
                </div>
                <div className="pointer-events-none text-center">
                  <h4 className="font-semibold text-gray-700">
                    {hasActiveUploads ? 'Uploading in background...' : 'Upload Video'}
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    {hasActiveUploads
                      ? 'Safe to close window'
                      : `Min. 1920x1080 · Max. ${MAX_WALLPAPER_FILE_SIZE / 1024 / 1024} MB · Encode ${
                          uploadProfile === 'ultra' ? 'Ultra (2160p)' : 'High (1440p)'
                        }`}
                  </p>
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
      className={`group relative aspect-video cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${
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
