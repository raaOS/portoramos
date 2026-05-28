#!/usr/bin/env tsx
/**
 * Hapus entry wallpaper dari `wallpaperConfig.collection` di D1 yang
 * URL-nya mengarah ke object R2 yang sudah tidak ada (dangling).
 *
 * Pakai `aboutService` baik untuk read maupun write supaya konsisten
 * dengan jalur yang dipakai UI admin & /api/about (nested via
 * `db.ref('content/about').set(...)`). Jangan pakai `setD1Value(...)`
 * mentah karena akan menulis ke row literal "content/about" yang
 * berbeda dari row nested.
 *
 * Run:
 *   npx tsx scripts/cloudflare/clear-dangling-wallpapers.ts
 *   npx tsx scripts/cloudflare/clear-dangling-wallpapers.ts --yes
 *   npx tsx scripts/cloudflare/clear-dangling-wallpapers.ts --dry-run
 */

import { config as loadEnv } from 'dotenv';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { aboutService } from '../../src/lib/services/aboutService';
import { listR2ObjectKeys, isR2StorageConfigured } from '../../src/lib/r2Storage';
import { extractStoragePath } from '../../src/lib/urlResolver';

const PREFIX = 'assets/wallpapers/';

interface Wallpaper {
  id: string;
  url: string;
  name?: string;
  posterUrl?: string;
}

async function confirmPrompt(question: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run');
  const skipConfirm = args.has('--yes') || args.has('-y');

  if (!isR2StorageConfigured()) {
    console.error('Cloudflare R2 env tidak lengkap. Aborting.');
    process.exit(1);
  }

  const about = await aboutService.getAboutData(true);
  const cfg = about?.wallpaperConfig;
  const collection: Wallpaper[] = (cfg?.collection || []) as Wallpaper[];

  if (collection.length === 0) {
    console.log('wallpaperConfig.collection sudah kosong, no-op.');
    return;
  }

  // Build set of R2 keys that physically exist under the wallpaper prefix.
  const r2Keys = new Set(await listR2ObjectKeys({ prefix: PREFIX }));

  // An entry is dangling if its `url` (the file the desktop renders)
  // points into the wallpaper prefix but the R2 key is missing. We
  // ignore poster-only mismatches because the desktop falls back to
  // first-frame extraction when the poster 404s — losing the poster
  // alone isn't enough reason to drop the wallpaper.
  const dangling: Wallpaper[] = [];
  const kept: Wallpaper[] = [];
  for (const w of collection) {
    const urlKey = w.url ? extractStoragePath(w.url) : null;
    const isInPrefix = !!urlKey && urlKey.startsWith(PREFIX);
    const isDangling = isInPrefix && urlKey !== null && !r2Keys.has(urlKey);
    if (isDangling) dangling.push(w);
    else kept.push(w);
  }

  console.log(`Total wallpapers in D1   : ${collection.length}`);
  console.log(`Dangling (akan dihapus)  : ${dangling.length}`);
  console.log(`Akan disimpan            : ${kept.length}`);
  console.log('');

  if (dangling.length === 0) {
    console.log('Tidak ada dangling. No-op.');
    return;
  }

  for (const w of dangling) {
    console.log(`  - ${w.id} ${w.url}`);
  }

  if (dryRun) {
    console.log('\n--dry-run aktif, tidak ada tulisan ke D1.');
    return;
  }

  if (!skipConfirm) {
    const ok = await confirmPrompt('\nLanjut hapus dari D1?');
    if (!ok) {
      console.log('Dibatalkan.');
      return;
    }
  }

  // Pick a new active wallpaper if the current active is one of the
  // dangling ones. Prefer the first kept entry; if everything was
  // dangling, leave activeWallpaperId empty so the public site falls
  // back to its bundled DEFAULT_WALLPAPER_URL.
  const oldActive = cfg?.activeWallpaperId || '';
  const activeStillValid = kept.some((w) => w.id === oldActive);
  const newActive = activeStillValid ? oldActive : kept[0]?.id || '';

  await aboutService.updateAboutData({
    wallpaperConfig: {
      ...cfg,
      activeWallpaperId: newActive,
      collection: kept,
    },
  } as Parameters<typeof aboutService.updateAboutData>[0]);

  console.log('');
  console.log(`Done. activeWallpaperId = "${newActive}"`);
  console.log(`Collection size sekarang = ${kept.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
