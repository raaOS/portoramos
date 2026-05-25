/**
 * Sync wallpaper config di Cloudflare D1 supaya pakai .webp
 * sebagai pengganti .png. Dipakai sekali setelah optimize-wallpapers.mjs
 * untuk hindari deep-merge override.
 *
 * Run:
 *   npx tsx scripts/cloudflare/fix-wallpaper-urls.ts
 *   npx tsx scripts/cloudflare/fix-wallpaper-urls.ts --dry-run
 *
 * Behavior:
 *  - Read `content/about` dari D1.
 *  - Untuk setiap entry di wallpaperConfig.collection yang URL-nya .png di
 *    /wallpapers/, cek apakah versi .webp sudah ada di public/. Kalau ada,
 *    rewrite URL ke .webp.
 *  - Tulis balik ke D1 hanya kalau ada perubahan.
 */
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

// Next.js project: load .env.local seperti yang dilakukan Next.js sendiri.
// dotenv/config default cuma baca .env.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import {
  getD1Value,
  setD1Value,
  isD1Configured,
  getMissingD1EnvKeys,
} from '../../src/lib/cloudflareD1';

interface Wallpaper {
  id: string;
  url: string;
  name?: string;
}
interface WallpaperConfig {
  activeWallpaperId?: string;
  collection?: Wallpaper[];
  blur?: number;
}
interface AboutLike {
  wallpaperConfig?: WallpaperConfig;
  [key: string]: unknown;
}

const PUBLIC_DIR = 'public';

function rewriteUrl(url: string): string | null {
  if (!url || !url.startsWith('/wallpapers/')) return null;
  if (extname(url).toLowerCase() !== '.png') return null;
  const base = basename(url, extname(url));
  const webpRel = `/wallpapers/${base}.webp`;
  const webpAbs = join(PUBLIC_DIR, 'wallpapers', `${base}.webp`);
  return existsSync(webpAbs) ? webpRel : null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!isD1Configured()) {
    console.error('D1 env tidak lengkap. Missing:', getMissingD1EnvKeys().join(', '));
    process.exit(1);
  }

  const about = await getD1Value<AboutLike>('content/about');
  if (!about) {
    console.log('content/about tidak ada di D1, tidak ada yang perlu di-sync.');
    return;
  }

  const cfg = about.wallpaperConfig;
  const collection = cfg?.collection || [];
  if (collection.length === 0) {
    console.log('wallpaperConfig.collection kosong, skip.');
    return;
  }

  let changed = 0;
  const updated = collection.map((w) => {
    const next = rewriteUrl(w.url);
    if (next && next !== w.url) {
      changed++;
      console.log(`  ${w.id}: ${w.url} -> ${next}`);
      return { ...w, url: next };
    }
    return w;
  });

  if (changed === 0) {
    console.log('Semua URL wallpaper di D1 sudah optimal, no-op.');
    return;
  }

  console.log(`\n${changed} URL akan di-rewrite di D1 key 'content/about'.`);

  if (dryRun) {
    console.log('Dry run aktif, tidak menulis ke D1.');
    return;
  }

  const newAbout: AboutLike = {
    ...about,
    wallpaperConfig: {
      ...(cfg || {}),
      collection: updated,
    },
    // ContentService schema: timestamp diserialize sebagai updatedAt
    updatedAt: new Date().toISOString(),
  };

  await setD1Value('content/about', newAbout);
  console.log('D1 updated.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
