#!/usr/bin/env tsx
/**
 * Backfill `posterUrl` on wallpaper entries in D1 that don't have one
 * persisted yet.
 *
 * Why this exists:
 *   The current upload pipeline (BackgroundUploadContext direct-to-R2)
 *   always persists `posterUrl` alongside `url`. Older wallpapers from
 *   the legacy era (server-side transcode JPG -> WebP) often only have
 *   `url` set, with the poster sitting in R2 as `<base>.webp`.
 *
 *   `DesktopBackground` works around this at runtime by probing both
 *   `<base>.jpg` and `<base>.webp`. That works but pays one 404 round
 *   trip per cold load for `.webp`-era entries. This script eliminates
 *   that probe by writing the verified poster URL back to D1.
 *
 * Behavior:
 *   - Read `content/about` via aboutService (nested D1 path).
 *   - For each wallpaper entry with no `posterUrl`:
 *       1. If url is not a video, skip.
 *       2. Try `headR2Object` for `<base>.jpg` first, then `.webp`.
 *       3. If a poster object exists, derive its public URL with
 *          `buildR2PublicUrl` and queue an update.
 *   - Write back to D1 via `aboutService.updateAboutData` only if
 *     anything changed.
 *
 * What this script does NOT do:
 *   - Does not create poster files in R2. If neither `.jpg` nor `.webp`
 *     side-car exists, the entry is left alone and the wallpaper will
 *     simply have no poster (consistent with current runtime behavior).
 *   - Does not re-derive poster from the video at runtime. That is a
 *     separate, heavier maintenance task.
 *   - Does not touch entries that already have `posterUrl` set, even
 *     if the file is missing in R2 — that's a dangling-pointer fixup
 *     and belongs in `clear-dangling-wallpapers.ts`.
 *
 * Run:
 *   npx tsx scripts/cloudflare/backfill-wallpaper-poster-urls.ts             # dry-run
 *   npx tsx scripts/cloudflare/backfill-wallpaper-poster-urls.ts --apply
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { isD1Configured, getMissingD1EnvKeys } from '../../src/lib/cloudflareD1';
import { aboutService } from '../../src/lib/services/aboutService';
import {
  buildR2PublicUrl,
  headR2Object,
  isR2StorageConfigured,
  getMissingR2EnvKeys,
} from '../../src/lib/r2Storage';

const VIDEO_PATTERN = /\.(mp4|webm|mov)([?#].*)?$/i;
const ASSET_PATH_PATTERN = /(^|\/)assets\//i;

interface Wallpaper {
  id: string;
  url: string;
  posterUrl?: string;
  [key: string]: unknown;
}

/**
 * Best-effort derivation of an R2 object key from a public URL.
 * Returns null when the URL doesn't look like an R2-served asset.
 *
 * Handled forms:
 *   - "/r2/assets/wallpapers/foo.mp4"  (proxy-style, current default)
 *   - ".../assets/wallpapers/foo.mp4" (direct-bucket public URL)
 */
function urlToR2Key(url: string): string | null {
  // Strip query string / hash before parsing.
  const clean = url.split(/[?#]/)[0];

  // Find the assets/ marker. Anything before that is the proxy/host
  // prefix and we don't care about it for the key.
  const idx = clean.indexOf('assets/');
  if (idx < 0) return null;
  return clean.slice(idx);
}

async function r2KeyExists(key: string): Promise<boolean> {
  try {
    await headR2Object(key);
    return true;
  } catch (e: unknown) {
    // S3 SDK returns 404 / NotFound for missing objects. We treat
    // anything else as a real error and rethrow so the script doesn't
    // silently skip on transient failures.
    const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
    const code = err?.$metadata?.httpStatusCode;
    if (code === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchKey') {
      return false;
    }
    throw e;
  }
}

async function findExistingPosterUrl(videoUrl: string): Promise<string | null> {
  const videoKey = urlToR2Key(videoUrl);
  if (!videoKey) return null;
  if (!ASSET_PATH_PATTERN.test(videoKey)) return null;

  const baseKey = videoKey.replace(/\.(mp4|webm|mov)$/i, '');

  // Order matches current convention preference: .jpg first.
  const candidates = [`${baseKey}.jpg`, `${baseKey}.webp`];

  for (const candidate of candidates) {
    if (await r2KeyExists(candidate)) {
      return buildR2PublicUrl(candidate);
    }
  }
  return null;
}

async function main() {
  const apply = process.argv.includes('--apply');

  if (!isD1Configured()) {
    console.error('D1 env tidak lengkap. Missing:', getMissingD1EnvKeys().join(', '));
    process.exit(1);
  }
  if (!isR2StorageConfigured()) {
    console.error('R2 env tidak lengkap. Missing:', getMissingR2EnvKeys().join(', '));
    process.exit(1);
  }

  const about = await aboutService.getAboutData(true);
  if (!about) {
    console.log('content/about tidak ada di D1, tidak ada yang perlu di-backfill.');
    return;
  }

  const cfg = about.wallpaperConfig;
  const collection: Wallpaper[] = (cfg?.collection || []) as Wallpaper[];
  if (collection.length === 0) {
    console.log('wallpaperConfig.collection kosong, skip.');
    return;
  }

  console.log(`Scanning ${collection.length} wallpaper entry...\n`);

  let backfilled = 0;
  let alreadyOk = 0;
  let noVideo = 0;
  let noPoster = 0;
  const updated: Wallpaper[] = [];

  for (const entry of collection) {
    if (entry.posterUrl) {
      alreadyOk++;
      updated.push(entry);
      continue;
    }
    if (!entry.url || !VIDEO_PATTERN.test(entry.url)) {
      noVideo++;
      updated.push(entry);
      continue;
    }

    const found = await findExistingPosterUrl(entry.url);
    if (!found) {
      noPoster++;
      console.log(`  [no-poster] ${entry.id}  (url=${entry.url})`);
      updated.push(entry);
      continue;
    }

    backfilled++;
    console.log(`  [backfill]  ${entry.id}  -> ${found}`);
    updated.push({ ...entry, posterUrl: found });
  }

  console.log('');
  console.log(`Already had posterUrl : ${alreadyOk}`);
  console.log(`Not a video           : ${noVideo}`);
  console.log(`Video, no poster file : ${noPoster}`);
  console.log(`Backfilled            : ${backfilled}`);

  if (backfilled === 0) {
    console.log('\nNo changes to write.');
    return;
  }

  if (!apply) {
    console.log('\nDry-run aktif (default). Jalankan dengan --apply untuk menulis ke D1.');
    return;
  }

  await aboutService.updateAboutData({
    wallpaperConfig: {
      ...(cfg || {}),
      collection: updated,
    },
  } as Parameters<typeof aboutService.updateAboutData>[0]);

  console.log('\nD1 updated via aboutService (nested write).');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
