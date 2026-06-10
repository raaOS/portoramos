import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { isR2StorageConfigured, listR2ObjectKeys, getMissingR2EnvKeys } from '@/lib/r2Storage';
import { extractStoragePath } from '@/lib/urlResolver';
import { aboutService } from '@/lib/services/aboutService';
import { projectService } from '@/lib/services/projectService';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { explorerService } from '@/lib/services/explorerService';
import { extractProjectAssets } from '@/lib/services/project/projectStorage';

/**
 * GET /api/admin/storage-stats
 *
 * Compares D1 references against R2 object listings and returns a
 * per-category breakdown of image vs video counts. Drives the storage
 * panel inside the admin Database popout, so admins can spot mismatches
 * (orphan files in R2 or dangling URLs in D1) at a glance.
 *
 * Auth:
 *   Admin-only. Read-only, so CSRF is not required.
 *
 * Caching:
 *   Listing R2 round-trips to S3, so we memoize the response in-process
 *   for 30s. Multiple admin tabs / quick popout toggles won't hammer
 *   ListObjectsV2.
 */

export const runtime = 'nodejs';

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)$/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|ico)$/i;

type MediaKind = 'image' | 'video' | 'other';

interface KindCounts {
  total: number;
  image: number;
  video: number;
  other: number;
}

interface CategoryStats {
  id: string;
  label: string;
  prefix: string;
  d1: KindCounts;
  r2: KindCounts;
  orphans: number;
  dangling: number;
  // List of R2 keys that don't appear in any D1 reference. Useful for
  // a future "Clean up" button without forcing the client to do its
  // own diff.
  orphanKeys: string[];
  // List of D1-referenced storage paths whose R2 object is missing.
  // Dangling references usually mean an upload failure or a manual
  // bucket cleanup that left D1 stale.
  danglingPaths: string[];
  /**
   * Human-readable note that explains the most common confusion: why
   * R2 can legitimately be larger than D1 (or vice versa) without it
   * being a "mismatch". Rendered inline in the admin panel.
   */
  note?: string;
  /**
   * Number of R2 objects that are convention-named side-car files
   * (e.g. `<base>-preview.mp4`, `<base>.jpg`) for video assets that
   * the upload pipeline writes alongside the main video. D1 doesn't
   * record these, but the public UI derives their URLs at render
   * time via `lib/mediaPreview.ts`.
   */
  sidecarCount: number;
}

interface StorageStatsResponse {
  categories: CategoryStats[];
  generatedAt: number;
  cached: boolean;
  warnings: string[];
}

const CACHE_TTL_MS = 30_000;
let cachedAt = 0;
let cachedPayload: StorageStatsResponse | null = null;
// Coalesce concurrent requests so two admin tabs don't both kick off
// a R2 ListObjectsV2 round-trip at the same time when the cache is cold.
let inflight: Promise<StorageStatsResponse> | null = null;

function classifyUrl(url: string | null | undefined): MediaKind {
  if (!url) return 'other';
  if (VIDEO_EXTENSIONS.test(url)) return 'video';
  if (IMAGE_EXTENSIONS.test(url)) return 'image';
  return 'other';
}

function emptyCounts(): KindCounts {
  return { total: 0, image: 0, video: 0, other: 0 };
}

function bumpCounts(counts: KindCounts, kind: MediaKind) {
  counts.total += 1;
  counts[kind] += 1;
}

function dedupePushKind(counts: KindCounts, seen: Set<string>, url: string | null | undefined) {
  if (!url) return;
  if (seen.has(url)) return;
  seen.add(url);
  bumpCounts(counts, classifyUrl(url));
}

interface BuildArgs {
  id: string;
  label: string;
  prefix: string;
  // D1 references collected as `(url, storagePathOrNull)`. Storage path
  // may be null for external URLs (Unsplash, fallback bundled assets).
  references: Array<{ url: string; storagePath: string | null }>;
  /**
   * When true the auditor expands each video reference to also cover
   * its convention-named side-cars (`<base>-preview.mp4`, `<base>.jpg`).
   * These are written by the upload pipeline and the public UI derives
   * their URLs at render time via `lib/mediaPreview.ts`, so D1 itself
   * doesn't list them. Without this flag the panel would always
   * report them as "orphan" and a naive cleanup would strip posters
   * and preview clips from every project / wallpaper video.
   */
  includeVideoSidecars?: boolean;
  allowUnreferencedR2?: boolean;
}

async function buildCategory({
  id,
  label,
  prefix,
  references,
  includeVideoSidecars,
  allowUnreferencedR2 = false,
}: BuildArgs): Promise<CategoryStats> {
  // D1 side: count by the URL the user actually sees, dedup by URL.
  const d1 = emptyCounts();
  const seenD1Urls = new Set<string>();

  // Two distinct sets, intentionally different roles:
  //   * primaryPathsInPrefix: paths actually referenced by D1 (url
  //     atau posterUrl yang tersimpan eksplisit di entry). HANYA set
  //     ini yang dihitung saat menentukan "dangling" — kalau D1
  //     bilang "saya nunjuk ke X" tapi X tidak ada di R2, itu
  //     dangling beneran.
  //   * derivedSidecarPaths: paths yang KEMUNGKINAN dibuat oleh
  //     pipeline upload (preview clip, poster auto-generate). D1
  //     tidak punya record langsung untuk ini, jadi mereka tidak
  //     boleh dihitung dangling kalau tidak ada di R2 — pipeline
  //     upload memang punya banyak cabang (skipPreview untuk
  //     wallpaper, image transcode JPEG→WebP), tidak semua side-car
  //     pasti ada. Tapi kalau MUNCUL di R2, jangan flag sebagai
  //     orphan — mereka memang sengaja generated.
  const primaryPathsInPrefix = new Set<string>();
  const derivedSidecarPaths = new Set<string>();

  for (const ref of references) {
    dedupePushKind(d1, seenD1Urls, ref.url);
    if (ref.storagePath && ref.storagePath.startsWith(prefix)) {
      primaryPathsInPrefix.add(ref.storagePath);

      if (includeVideoSidecars) {
        const m = ref.storagePath.match(/^(.*)\.(mp4|webm|mov)$/i);
        if (m) {
          const base = m[1];
          // Preview side-car (kalau ada).
          derivedSidecarPaths.add(`${base}-preview.mp4`);
          // Poster auto-generate. Pipeline punya dua jalur:
          //   (a) Server ffmpeg → poster .jpg (untuk project upload
          //       FormData yang tidak skipPreview).
          //   (b) Direct-to-R2 (wallpaper) → poster di-capture
          //       client sebagai JPG, lalu server `/api/upload`
          //       transcode ke WebP via sharp → file akhir .webp.
          //       URL hasilnya disimpan di `posterUrl` di D1, jadi
          //       sudah masuk primaryPathsInPrefix.
          // Untuk safety, derive kedua extension supaya kalau salah
          // satu muncul di R2 tetap dianggap referenced (bukan
          // orphan). Ketidakhadiran-nya tidak menjadi dangling.
          derivedSidecarPaths.add(`${base}.jpg`);
          derivedSidecarPaths.add(`${base}.webp`);
        }
      }
    }
  }

  // R2 side: full prefix listing. Dedup is implicit since R2 keys are
  // already unique within a bucket.
  const r2 = emptyCounts();
  const r2Keys = await listR2ObjectKeys({ prefix });
  for (const key of r2Keys) {
    bumpCounts(r2, classifyUrl(key));
  }

  // Orphans: R2 keys that are not D1-referenced AND not a known
  // side-car of a D1-referenced video. Side-car yang muncul di R2
  // ditolerir (memang sengaja generated oleh pipeline).
  const orphanKeys: string[] = [];
  for (const key of r2Keys) {
    if (allowUnreferencedR2) continue;
    if (primaryPathsInPrefix.has(key)) continue;
    if (derivedSidecarPaths.has(key)) continue;
    orphanKeys.push(key);
  }

  // Dangling: HANYA primary D1 path yang tidak ada di R2.
  // Side-car yang tidak ada di R2 tidak dihitung dangling — pipeline
  // upload memang tidak selalu menghasilkan semua side-car (mis.
  // wallpaper skipPreview, atau poster yang sudah ditranscode ke
  // extension berbeda dan tercatat eksplisit di D1).
  const r2KeySet = new Set(r2Keys);
  const danglingPaths: string[] = [];
  for (const path of primaryPathsInPrefix) {
    if (!r2KeySet.has(path)) {
      danglingPaths.push(path);
    }
  }

  // Count side-cars that physically exist in R2 — that's what gives
  // the UI the "5 file utama + 10 file pendamping" copy.
  let sidecarCount = 0;
  for (const key of r2Keys) {
    if (derivedSidecarPaths.has(key)) sidecarCount++;
  }

  return {
    id,
    label,
    prefix,
    d1,
    r2,
    orphans: orphanKeys.length,
    dangling: danglingPaths.length,
    orphanKeys,
    danglingPaths,
    sidecarCount,
  };
}

async function safeCollect<T>(
  label: string,
  warnings: string[],
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    console.warn(`[storage-stats] ${label} failed: ${msg}`);
    warnings.push(`${label}: ${msg}`);
    return fallback;
  }
}

async function runStats(): Promise<StorageStatsResponse> {
  const warnings: string[] = [];

  // Read all D1 sources in parallel; a failure in any one collector
  // becomes a warning rather than a hard 500, so the panel still
  // renders partial data.
  const [aboutData, projectsBundle, hardSkillData] = await Promise.all([
    safeCollect('aboutService', warnings, () => aboutService.getAboutData(true), null),
    safeCollect('projectService', warnings, () => projectService.getProjects(undefined, true), {
      projects: [],
      lastUpdated: '',
    }),
    safeCollect('hardSkillService', warnings, () => hardSkillService.getHardSkills(true), {
      skills: [],
      lastUpdated: '',
    } as Awaited<ReturnType<typeof hardSkillService.getHardSkills>>),
  ]);

  // ── Wallpapers ───────────────────────────────────────────────
  const wallpaperRefs: BuildArgs['references'] = [];
  const wallpaperCollection = aboutData?.wallpaperConfig?.collection || [];
  for (const w of wallpaperCollection) {
    if (w?.url) {
      wallpaperRefs.push({ url: w.url, storagePath: extractStoragePath(w.url) });
    }
    if (w?.posterUrl) {
      wallpaperRefs.push({
        url: w.posterUrl,
        storagePath: extractStoragePath(w.posterUrl),
      });
    }
  }

  // ── Projects ─────────────────────────────────────────────────
  const projectRefs: BuildArgs['references'] = [];
  for (const p of projectsBundle.projects) {
    const urls = extractProjectAssets(p);
    for (const url of urls) {
      projectRefs.push({ url, storagePath: extractStoragePath(url) });
    }
  }

  // ── Hard skill and Dock icons ─────────────────────────────────
  const iconRefs: BuildArgs['references'] = [];
  for (const skill of hardSkillData.skills || []) {
    if (skill?.iconUrl) {
      iconRefs.push({
        url: skill.iconUrl,
        storagePath: extractStoragePath(skill.iconUrl),
      });
    }
  }

  const dockConfig = aboutData?.dockConfig || {};
  for (const key of Object.keys(dockConfig)) {
    const item = dockConfig[key];
    if (item?.iconUrl) {
      iconRefs.push({
        url: item.iconUrl,
        storagePath: extractStoragePath(item.iconUrl),
      });
    }
  }

  const explorerRefs: BuildArgs['references'] = [];
  const explorerNodes = await explorerService.getAllNodes();
  for (const node of explorerNodes) {
    if (node.type !== 'file') continue;
    explorerRefs.push({
      url: node.url,
      storagePath: node.storageKey || extractStoragePath(node.url),
    });
    if (node.previewUrl || node.previewKey) {
      explorerRefs.push({
        url: node.previewUrl || node.previewKey || '',
        storagePath:
          node.previewKey || (node.previewUrl ? extractStoragePath(node.previewUrl) : null),
      });
    }
    if (node.thumbnailUrl || node.thumbnailKey) {
      explorerRefs.push({
        url: node.thumbnailUrl || node.thumbnailKey || '',
        storagePath:
          node.thumbnailKey || (node.thumbnailUrl ? extractStoragePath(node.thumbnailUrl) : null),
      });
    }
  }
  const explorerManagedRefs = explorerRefs.filter((ref) =>
    ref.storagePath?.startsWith('assets/explorer/')
  );
  const explorerLegacyRefs = explorerRefs.filter((ref) =>
    ref.storagePath?.startsWith('assets/media/')
  );

  // Build per-category stats. R2 listing is parallelized inside
  // buildCategory's await chain via Promise.all here.
  let categories: CategoryStats[];
  if (!isR2StorageConfigured()) {
    warnings.push(
      `Cloudflare R2 env tidak lengkap (${getMissingR2EnvKeys().join(', ')}). R2 counts disabled.`
    );
    categories = [
      {
        id: 'wallpapers',
        label: 'Desktop Wallpaper',
        prefix: 'assets/wallpapers/',
        d1: countByKind(wallpaperRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'projects',
        label: 'Project Assets',
        prefix: 'assets/projects/',
        d1: countByKind(projectRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'hardSkillIcons',
        label: 'Hard Skill & Dock Icons',
        prefix: 'assets/icons-library/',
        d1: countByKind(iconRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'explorer',
        label: 'Explorer Files',
        prefix: 'assets/explorer/',
        d1: countByKind(explorerManagedRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'explorerLegacy',
        label: 'Explorer Legacy Media',
        prefix: 'assets/media/',
        d1: countByKind(explorerLegacyRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
    ];
  } else {
    categories = await Promise.all([
      buildCategory({
        id: 'wallpapers',
        label: 'Desktop Wallpaper',
        prefix: 'assets/wallpapers/',
        references: wallpaperRefs,
        includeVideoSidecars: true,
      }),
      buildCategory({
        id: 'projects',
        label: 'Project Assets',
        prefix: 'assets/projects/',
        references: projectRefs,
        includeVideoSidecars: true,
      }),
      buildCategory({
        id: 'hardSkillIcons',
        label: 'Hard Skill & Dock Icons',
        prefix: 'assets/icons-library/',
        references: iconRefs,
      }),
      buildCategory({
        id: 'explorer',
        label: 'Explorer Files',
        prefix: 'assets/explorer/',
        references: explorerManagedRefs,
        // FIX (BUG-2): Explorer videos produce sidecar files (-preview.mp4,
        // .jpg poster) via the upload pipeline, same as projects/wallpapers.
        // Without this flag, those sidecars appear as "orphan" in the admin
        // storage dashboard and a naive cleanup would delete them.
        includeVideoSidecars: true,
      }),
      buildCategory({
        id: 'explorerLegacy',
        label: 'Explorer Legacy Media',
        prefix: 'assets/media/',
        references: explorerLegacyRefs,
        allowUnreferencedR2: true,
      }),
    ]);
  }

  // Annotate every category with a plain-language note. Big numbers
  // tucked inside a tooltip-less grid don't help an admin who hasn't
  // read the schema; the note explains the most common confusion in
  // 1–2 sentences.
  for (const cat of categories) {
    cat.note = describeCategory(cat);
  }

  return {
    categories,
    generatedAt: Date.now(),
    cached: false,
    warnings,
  };
}

function countByKind(references: BuildArgs['references']): KindCounts {
  const counts = emptyCounts();
  const seen = new Set<string>();
  for (const ref of references) {
    dedupePushKind(counts, seen, ref.url);
  }
  return counts;
}

/**
 * Render a 1–2 sentence note that an admin can read without knowing
 * the underlying schema. Specifically explains why D1 and R2 totals
 * look different even when they're in sync.
 */
function describeCategory(cat: CategoryStats): string {
  if (cat.id === 'wallpapers') {
    if (cat.d1.total === 0 && cat.r2.total === 0) {
      return 'Belum ada wallpaper kustom. Site memakai DEFAULT_WALLPAPER_URL bawaan.';
    }
    if (cat.dangling > 0) {
      return `${cat.dangling} wallpaper merujuk file yang sudah tidak ada di R2 (dangling). Ini terjadi kalau file di-hapus manual dari bucket. Re-upload via admin atau hapus entry dangling lewat scripts/cloudflare/clear-dangling-wallpapers.ts.`;
    }
    if (cat.orphans > 0) {
      return `${cat.orphans} file di R2 tidak terhubung ke wallpaper manapun (orphan). Biasanya sisa upload yang gagal.`;
    }
    // Hitungan akurat: 1 wallpaper video selalu menghasilkan 2 D1 URL
    // (url + posterUrl). Image wallpaper hanya 1 URL (tanpa poster).
    const videoCount = cat.d1.video; // jumlah file video utama
    const imageCount = Math.max(0, cat.d1.image - videoCount); // poster bukan wallpaper image standalone
    const parts: string[] = [];
    if (videoCount > 0) {
      parts.push(`${videoCount} video wallpaper (file utama + poster)`);
    }
    if (imageCount > 0) {
      parts.push(`${imageCount} image wallpaper`);
    }
    const summary = parts.length > 0 ? parts.join(' + ') : `${cat.d1.total} URL`;
    return `${summary}. Total ${cat.d1.total} URL di D1, ${cat.r2.total} file di R2 — angka cocok.`;
  }

  if (cat.id === 'projects') {
    if (cat.d1.total === 0 && cat.r2.total === 0) {
      return 'Belum ada project dengan media.';
    }
    if (cat.dangling > 0) {
      return `${cat.dangling} project merujuk file yang hilang dari R2 (dangling). Cek scripts/cloudflare/audit-orphan-projects.ts untuk detail.`;
    }
    if (cat.orphans > 0) {
      return `${cat.orphans} file di R2 tidak terhubung ke project manapun (orphan). Sisa upload gagal atau project yang dihapus tanpa cleanup asset.`;
    }
    const explainer =
      cat.sidecarCount > 0
        ? `D1 mencatat ${cat.d1.total} URL utama (cover, gallery, before/after — ${cat.d1.image} image + ${cat.d1.video} video). R2 menyimpan file utama plus ${cat.sidecarCount} file pendamping (preview clip + poster) yang dibuat otomatis untuk tiap video. Jadi R2 ${cat.r2.total} = D1 ${cat.d1.total} + side-car ${cat.sidecarCount}.`
        : `D1 mencatat ${cat.d1.total} URL utama (${cat.d1.image} image + ${cat.d1.video} video). R2 menyimpan file utama yang persis sama.`;
    return explainer;
  }

  if (cat.id === 'hardSkillIcons') {
    if (cat.d1.total > 0 && cat.r2.total === 0) {
      return `${cat.d1.total} icon URL tersimpan di database. Semua mengarah ke CDN eksternal, bukan R2 — wajar kalau R2 kosong untuk kategori ini.`;
    }
    if (cat.dangling > 0) {
      return `${cat.dangling} icon URL dirujuk di database tapi file-nya hilang dari R2.`;
    }
    if (cat.orphans > 0) {
      return `${cat.orphans} icon di R2 tidak dipakai oleh skill atau dock item manapun.`;
    }
    return `${cat.d1.total} icon URL tersimpan di database.`;
  }

  if (cat.id === 'explorer' || cat.id === 'explorerLegacy') {
    if (cat.id === 'explorerLegacy' && cat.d1.total === 0 && cat.r2.total > 0) {
      return `${cat.r2.total} legacy object masih ada di assets/media. Prefix ini tidak lagi dikelola D1 Explorer, jadi tidak dihitung sebagai mismatch.`;
    }
    if (cat.d1.total === 0 && cat.r2.total === 0) {
      return cat.id === 'explorer'
        ? 'Belum ada file Explorer di namespace baru.'
        : 'Tidak ada file Explorer legacy di assets/media.';
    }
    if (cat.dangling > 0) {
      return `${cat.dangling} file Explorer merujuk object R2 yang hilang.`;
    }
    if (cat.orphans > 0) {
      return `${cat.orphans} object R2 di prefix ini tidak punya referensi Explorer.`;
    }
    return `${cat.d1.total} URL Explorer tersinkron dengan ${cat.r2.total} object R2.`;
  }

  return '';
}

export async function GET(req: NextRequest) {
  try {
    if (!(await validateAdminRequest(req, { checkCsrf: false }))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fresh = req.nextUrl.searchParams.get('fresh') === 'true';
    const now = Date.now();

    if (!fresh && cachedPayload && now - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({ ...cachedPayload, cached: true });
    }

    if (!inflight) {
      inflight = runStats().finally(() => {
        // Clear the slot *after* the result is settled so a subsequent
        // request right after this one rolls over into the freshly
        // populated cache instead of starting another round-trip.
        inflight = null;
      });
    }
    const payload = await inflight;
    cachedPayload = payload;
    cachedAt = now;

    return NextResponse.json(payload);
  } catch (e) {
    console.error('[storage-stats] error:', e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Failed to compute storage stats',
      },
      { status: 500 }
    );
  }
}
