'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import {
  useFFmpeg,
  type VideoCompressionProfile,
} from '@/app/admin/components/file-upload/hooks/useFFmpeg';
import { useToast } from '@/contexts/ToastContext';
import { mutate } from 'swr';
import { useQueryClient } from '@tanstack/react-query';
import { ADMIN_QUERY_KEYS } from '@/app/admin/lib/adminQueries';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { UploadedAsset } from '@/app/admin/components/file-upload/types';
import { AboutData, WallpaperConfig } from '@/types/about';
import { readVideoDimensions } from '@/lib/videoMeta';

/**
 * Profil yang relevan untuk wallpaper. `standard` (720p) tidak diekspos
 * di sini karena wallpaper tampil fullscreen — pakai 720p akan terlihat
 * pecah di panel 1080p+.
 */
export type WallpaperUploadProfile = Extract<VideoCompressionProfile, 'high' | 'ultra'>;

export interface BackgroundUploadTask {
  id: string;
  filename: string;
  progress: number;
  status:
    | 'starting'
    | 'compressing'
    | 'uploading'
    | 'processing'
    | 'finalizing'
    | 'complete'
    | 'error';
  /**
   * Sub-status detail untuk fase compress (misal "Loading core",
   * "Compressing 35% - ~12s remaining"). Diisi dari `useFFmpeg.onStatusUpdate`.
   * Membantu admin tahu encode benar-benar jalan & estimasi waktu sisa.
   */
  statusDetail?: string;
  error?: string;
  type: 'wallpaper';
  profile?: WallpaperUploadProfile;
}

interface BackgroundUploadContextType {
  tasks: BackgroundUploadTask[];
  enqueueWallpaperUpload: (file: File, options?: { profile?: WallpaperUploadProfile }) => void;
  removeTask: (id: string) => void;
  hasActiveUploads: boolean;
  totalProgress: number;
}

const BackgroundUploadContext = createContext<BackgroundUploadContextType | undefined>(undefined);

import { useCsrfToken } from '@/hooks/useCsrfToken';

// ── Compression heuristics ──────────────────────────────────────────────
//
// Wallpaper di-compress di browser (WASM ffmpeg) supaya server tidak
// pernah harus terima video besar dan supaya output yang sampai ke
// monitor admin/visitor sudah dinormalisasi ke target resolusi.
//
// Skip-on-good-source heuristic per profile (file source sudah bagus →
// pass-through, hindari re-encode yang malah merusak quality):
//   * 'high'  (1440p): file ≤ 25 MB & lebar ≤ 2560 px → biarkan apa adanya
//   * 'ultra' (2160p): file ≤ 50 MB & lebar ≤ 3840 px → biarkan apa adanya
//
// Ceiling 60 MB. File di atas itu di-tolak (lihat WallpaperManager
// validation) — admin diminta export ulang dulu. Live wallpaper 4K dari
// internet tipikal 30-50 MB, jadi 60 MB cukup longgar untuk pass-through
// ultra; di sisi lain mencegah upload 200 MB raw export yang bikin
// visitor sengsara.
const MAX_CLIENT_COMPRESS_SIZE = 60 * 1024 * 1024; // 60 MB

const SKIP_COMPRESS_BY_PROFILE: Record<
  WallpaperUploadProfile,
  { sizeBytes: number; widthPx: number }
> = {
  high: { sizeBytes: 25 * 1024 * 1024, widthPx: 2560 },
  ultra: { sizeBytes: 50 * 1024 * 1024, widthPx: 3840 },
};

const DEFAULT_WALLPAPER_PROFILE: WallpaperUploadProfile = 'high';

export function BackgroundUploadProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundUploadTask[]>([]);
  const csrfToken = useCsrfToken();
  const queryClient = useQueryClient();
  const { uploadVideoDirectToR2 } = useStorageUpload({
    folder: 'wallpapers',
    csrfToken: csrfToken || '',
  });

  // Track which task is currently being encoded so we can route the
  // hook's `onStatusUpdate` callback to the right entry. WASM ffmpeg
  // is single-threaded (we serialize via `compressChainRef`), jadi
  // selalu max 1 task encoding di waktu bersamaan.
  const encodingTaskIdRef = useRef<string | null>(null);

  const updateTaskRef = useRef<((id: string, updates: Partial<BackgroundUploadTask>) => void) | null>(null);

  // Forward useFFmpeg status string ke task statusDetail. Callback
  // identity stable supaya tidak menyebabkan re-load WASM core
  // tiap render — useFFmpeg loadCore depends on this callback.
  const handleEncodeStatus = useCallback((statusDetail: string) => {
    const taskId = encodingTaskIdRef.current;
    if (!taskId) return;
    updateTaskRef.current?.(taskId, { statusDetail });
  }, []);
  const { compressVideo } = useFFmpeg(handleEncodeStatus);
  const { showSuccess, showError, showWarning } = useToast();

  // Serialize the read-modify-write of `wallpaperConfig` so that two
  // concurrent uploads don't clobber each other's collection update.
  // Without this, upload B reads the same `current` snapshot as upload A
  // and writes back a collection missing A's entry (last-write-wins).
  const finalizeChainRef = useRef<Promise<unknown>>(Promise.resolve());

  // WASM ffmpeg single-threaded — dua encode paralel akan saling rebut
  // FFmpeg instance dan menghasilkan file korup. Serialkan encode di
  // sini supaya beberapa drag/drop sekaligus tetap aman; upload network
  // tetap paralel (dipisah per-task).
  const compressChainRef = useRef<Promise<unknown>>(Promise.resolve());

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<BackgroundUploadTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Keep ref pointing at latest updateTask so the encode-status
  // callback (handleEncodeStatus) can dispatch into it without
  // capturing a stale closure. Pakai useEffect (bukan assignment
  // langsung di render) supaya tidak melanggar `react-hooks/refs`
  // rule. updateTask identity stable via useCallback([], jadi
  // effect cuma jalan sekali setelah mount.
  useEffect(() => {
    updateTaskRef.current = updateTask;
  }, [updateTask]);

  const hasActiveUploads = tasks.some(t => t.status !== 'complete' && t.status !== 'error');
  const activeTasks = tasks.filter(t => t.status !== 'complete' && t.status !== 'error');
  const totalProgress = activeTasks.length > 0
    ? activeTasks.reduce((sum, t) => sum + t.progress, 0) / activeTasks.length
    : 0;

  const enqueueWallpaperUpload = useCallback(
    async (file: File, options?: { profile?: WallpaperUploadProfile }) => {
      const profile = options?.profile ?? DEFAULT_WALLPAPER_PROFILE;
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      setTasks((prev) => [
        ...prev,
        {
          id: taskId,
          filename: file.name,
          progress: 0,
          status: 'starting',
          type: 'wallpaper',
          profile,
        },
      ]);

      try {
        const isVideo = file.type.startsWith('video/');
        if (!isVideo) {
          throw new Error('Only video wallpapers are supported via background upload at this time.');
        }

        // ── 1. Decide whether to client-compress ─────────────────────
        // Baca dimensi sekali dari File (gratis, byte-range metadata).
        // WallpaperManager sudah memanggil `validateWallpaperFiles` yang
        // membaca dimensi serupa untuk validasi 1920×1080; pemanggilan
        // di sini terjadi setelah validasi sukses, jadi paling buruk
        // dua kali decode metadata — tetap murah (<100 ms).
        let dimensions: { width: number; height: number } | null = null;
        try {
          const dim = await readVideoDimensions(file);
          dimensions = { width: dim.width, height: dim.height };
        } catch {
          // Dimensi tidak terbaca — tetap lanjut, server akan handle.
          dimensions = null;
        }

        const skipBudget = SKIP_COMPRESS_BY_PROFILE[profile];
        const isOversized = file.size > MAX_CLIENT_COMPRESS_SIZE;

        if (isOversized) {
          // Tolak upload — tidak fallback as-is. Live wallpaper 60+ MB
          // bikin visitor sengsara di mobile network dan deteriorate
          // Lighthouse LCP score. Lebih bersih kasih admin pesan tegas
          // untuk export ulang dulu daripada mengizinkan asset jelek
          // masuk koleksi.
          throw new Error(
            `Wallpaper ${(file.size / 1024 / 1024).toFixed(1)} MB melewati batas ` +
              `${MAX_CLIENT_COMPRESS_SIZE / 1024 / 1024} MB. Export ulang ke ` +
              `${profile === 'ultra' ? '2160p (~30-50 MB)' : '1440p (~10-20 MB)'} dulu, ` +
              `lalu upload lagi.`
          );
        }

        const isAlreadySmall =
          file.size <= skipBudget.sizeBytes &&
          (dimensions ? dimensions.width <= skipBudget.widthPx : true);
        const shouldCompress = !isAlreadySmall;

        let fileToUpload: File = file;

        if (shouldCompress) {
          updateTask(taskId, { status: 'compressing', progress: 1 });

          // Serialize multiple concurrent ffmpeg invocations through a
          // single WASM instance. Awaiting the previous chain entry
          // means the second drag/drop waits for the first to finish
          // encoding, then runs.
          const previousCompress = compressChainRef.current;
          const compressPromise = previousCompress
            .catch((prevErr) => {
              // Previous task in the chain failed — that failure was
              // already surfaced by ITS own catch handler (toast +
              // task status). We only swallow here so this task's
              // encode can still start; logging keeps the trail.
              if (prevErr) {
                console.warn(
                  '[BackgroundUpload] previous compress in chain failed, continuing:',
                  prevErr
                );
              }
              return undefined;
            })
            .then(async () => {
              const originalSize = file.size;
              // Mark this task as the one currently encoding so the
              // shared `useFFmpeg.onStatusUpdate` callback knows
              // which task to dispatch its status string to.
              encodingTaskIdRef.current = taskId;
              try {
                const compressed = await compressVideo(
                  file,
                  (encodePercent) => {
                    // 1 → 70 reserved for client encode; 70 → 95 for
                    // network upload, 95 → 100 for finalize.
                    const mapped = 1 + (encodePercent / 100) * 69;
                    updateTask(taskId, { progress: Math.min(70, mapped) });
                  },
                  { profile }
                );
                const newSize = compressed.size;
                const profileLabel = profile === 'ultra' ? 'Ultra (2160p)' : 'High (1440p)';
                showSuccess(
                  `Wallpaper compressed [${profileLabel}]: ${(originalSize / 1024 / 1024).toFixed(1)} MB → ${(
                    newSize /
                    1024 /
                    1024
                  ).toFixed(1)} MB`
                );
                return compressed;
              } finally {
                // Clear marker no matter what — next task akan set
                // ulang. Tanpa clear ini, status callback akan
                // route ke task yang sudah selesai.
                if (encodingTaskIdRef.current === taskId) {
                  encodingTaskIdRef.current = null;
                }
              }
            });
          // Chain marker also catches its own error so the next
          // upload doesn't accidentally inherit a rejected promise.
          // Logging is handled by the inner catch above.
          compressChainRef.current = compressPromise.catch((err) => {
            console.warn('[BackgroundUpload] compress chain link rejected:', err);
            return undefined;
          });

          try {
            fileToUpload = await compressPromise;
          } catch (compressErr) {
            // WASM ffmpeg load gagal atau OOM — fallback upload
            // original. Server tidak akan re-encode (direct PUT),
            // tapi minimal video tetap masuk dan bisa direplace
            // setelah admin tahu engine-nya offline.
            console.warn('[BackgroundUpload] client compression failed, uploading original:', compressErr);
            showWarning(
              'Compression engine offline. Uploading wallpaper as-is — kualitas tergantung file asli.'
            );
            fileToUpload = file;
          }
          // Clear status detail before transitioning to upload phase
          // supaya tooltip tidak nyangkut menampilkan "Compressing 100%".
          updateTask(taskId, { statusDetail: undefined });
        }

        updateTask(taskId, { status: 'uploading', progress: shouldCompress ? 70 : 5 });

        // Capture poster frame locally if possible.
        // Pakai `fileToUpload` (bukan `file`) supaya poster konsisten
        // dengan video yang benar-benar masuk R2 (penting kalau client
        // compress mengubah aspect/crop di masa depan; saat ini
        // compressVideo tidak crop tanpa trimOptions, tapi poster yang
        // selaras tetap lebih aman).
        let posterBlob: Blob | null = null;
        try {
          const { captureVideoPoster } = await import('@/lib/videoPoster');
          const captured = await captureVideoPoster(fileToUpload);
          posterBlob = captured.blob;
        } catch (e) {
          console.warn('Poster capture failed (will skip):', e);
        }

        const networkStart = shouldCompress ? 70 : 5;
        const networkSpan = shouldCompress ? 25 : 90;
        const result = await uploadVideoDirectToR2(fileToUpload, {
          posterBlob,
          onUploadProgress: (networkProgress) => {
            updateTask(taskId, {
              progress: networkStart + (networkProgress / 100) * networkSpan,
            });
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'Direct R2 upload failed');
        }

        updateTask(taskId, { status: 'finalizing', progress: 95 });

        const newAsset: UploadedAsset = {
          url: result.url,
          previewUrl: result.previewUrl,
          posterUrl: result.posterUrl,
        };

        // Serialize finalize across concurrent uploads. Each upload waits
        // for the previous one's read-modify-write to commit so the
        // `current.wallpaperConfig.collection` snapshot we merge against
        // already includes the previous wallpaper.
        const previousChain = finalizeChainRef.current;
        const finalizePromise = previousChain
          .catch((prevErr) => {
            // Previous finalize failed — that task already surfaced
            // its own error. Swallow so this task can proceed; log
            // for diagnostics.
            if (prevErr) {
              console.warn(
                '[BackgroundUpload] previous finalize in chain failed, continuing:',
                prevErr
              );
            }
            return undefined;
          })
          .then(async () => {
            const token = getWritableCsrfToken(csrfToken);

            // Read the freshest about payload from D1 (not the cached
            // copy; otherwise we'd lose updates made between uploads).
            const res = await fetch('/api/about?fresh=true', {
              credentials: 'include',
              cache: 'no-store',
            });
            if (!res.ok) {
              throw new Error(`Failed to load current about data (${res.status})`);
            }
            const aboutData = (await res.json()) as AboutData;
            const config: WallpaperConfig = aboutData.wallpaperConfig || {
              activeWallpaperId: '',
              collection: [],
            };

            const newWallpaper = {
              id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: newAsset.url,
              posterUrl: newAsset.posterUrl,
              name: 'Custom Wallpaper',
            };

            const newCollection = [...(config.collection || []), newWallpaper];

            // /api/about expects a partial UpdateAboutData at top level
            // (validated by updateAboutSchema.strict()). Anything wrapped
            // in `{ updates: ... }` is rejected as an unknown key.
            const payload: { wallpaperConfig: WallpaperConfig } = {
              wallpaperConfig: {
                ...config,
                activeWallpaperId: newWallpaper.id,
                collection: newCollection,
              },
            };

            const updateRes = await fetch('/api/about', {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': token,
              },
              body: JSON.stringify(payload),
            });

            if (!updateRes.ok) {
              const errBody = await updateRes
                .json()
                .catch(() => ({}) as { error?: string; details?: string });
              throw new Error(
                errBody.error ||
                  errBody.details ||
                  `Failed to save wallpaper config (${updateRes.status})`
              );
            }

            const updateBody = (await updateRes.json().catch(() => null)) as
              | { success?: boolean; data?: AboutData }
              | null;

            // Push the fresh snapshot into the React Query cache so the
            // open WallpaperManager / appearance panel re-renders with
            // the newly added wallpaper without an extra round-trip.
            if (updateBody?.data) {
              queryClient.setQueryData(ADMIN_QUERY_KEYS.about, updateBody.data);
              // Pre-populate SWR cache dengan snapshot yang sama.
              // Pakai `revalidate: false` supaya tidak trigger fetch
              // berikutnya yang bisa balik dengan cached response
              // dari server-side cache (race window kecil tapi nyata
              // saat upload back-to-back). Tanpa flag ini, SWR
              // default-nya revalidate setelah set.
              await mutate('/api/about', updateBody.data, { revalidate: false });
            } else {
              await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.about });
              await mutate('/api/about');
            }
          });

        // Store a rejection-tolerant marker so the next upload's
        // chain doesn't inherit a rejected promise. Original
        // `finalizePromise` is awaited below to surface error.
        finalizeChainRef.current = finalizePromise.catch((err) => {
          console.warn('[BackgroundUpload] finalize chain link rejected:', err);
          return undefined;
        });
        await finalizePromise;

        updateTask(taskId, { status: 'complete', progress: 100 });
        showSuccess(`Wallpaper video "${file.name}" has been uploaded and applied!`);

        // Clean up task after 3 seconds
        setTimeout(() => removeTask(taskId), 3000);

      } catch (error) {
        console.error('[BackgroundUpload]', error);
        updateTask(taskId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        showError(`Failed to upload ${file.name}`);
        // Clean up task after 5 seconds
        setTimeout(() => removeTask(taskId), 5000);
      }
    },
    [
      uploadVideoDirectToR2,
      updateTask,
      showSuccess,
      showError,
      showWarning,
      removeTask,
      csrfToken,
      queryClient,
      compressVideo,
    ]
  );

  return (
    <BackgroundUploadContext.Provider
      value={{
        tasks,
        enqueueWallpaperUpload,
        removeTask,
        hasActiveUploads,
        totalProgress,
      }}
    >
      {children}
    </BackgroundUploadContext.Provider>
  );
}

export function useBackgroundUpload() {
  const context = useContext(BackgroundUploadContext);
  if (context === undefined) {
    throw new Error('useBackgroundUpload must be used within a BackgroundUploadProvider');
  }
  return context;
}
