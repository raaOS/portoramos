#!/usr/bin/env node
/**
 * Konversi semua wallpaper PNG di public/wallpapers ke WebP + AVIF.
 * Tujuan: turunkan LCP halaman utama. Wallpaper aktif sebelumnya 1.4MB PNG
 * -> WebP ~30-50KB.
 *
 * Behavior:
 *  - Skip kalau .webp dan .avif sudah ada DAN lebih baru dari sumber PNG.
 *  - Pertahankan PNG asli supaya nggak break referensi lama.
 *  - Quality 80 untuk WebP, 60 untuk AVIF (visually lossless di display 1080p+).
 *  - Resize max 2560px width supaya nggak ada wallpaper boros di display kecil.
 */
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const WALLPAPER_DIR = 'public/wallpapers';
const MAX_WIDTH = 2560;
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 60;

async function isStaleOrMissing(target, source) {
  if (!existsSync(target)) return true;
  const [t, s] = await Promise.all([stat(target), stat(source)]);
  return t.mtimeMs < s.mtimeMs;
}

async function convertOne(file) {
  const src = join(WALLPAPER_DIR, file);
  const base = basename(file, extname(file));
  const webp = join(WALLPAPER_DIR, `${base}.webp`);
  const avif = join(WALLPAPER_DIR, `${base}.avif`);

  const tasks = [];
  const log = (msg) => console.log(`  ${msg}`);

  if (await isStaleOrMissing(webp, src)) {
    tasks.push(
      sharp(src)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 6 })
        .toFile(webp)
        .then((info) => log(`webp ${(info.size / 1024).toFixed(1)}KB`))
    );
  } else {
    log('webp up-to-date');
  }

  if (await isStaleOrMissing(avif, src)) {
    tasks.push(
      sharp(src)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .avif({ quality: AVIF_QUALITY, effort: 6 })
        .toFile(avif)
        .then((info) => log(`avif ${(info.size / 1024).toFixed(1)}KB`))
    );
  } else {
    log('avif up-to-date');
  }

  await Promise.all(tasks);
}

async function main() {
  const entries = await readdir(WALLPAPER_DIR);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith('.png'));

  if (pngs.length === 0) {
    console.log('No PNG wallpapers found in', WALLPAPER_DIR);
    return;
  }

  console.log(`Optimizing ${pngs.length} wallpaper(s)...`);
  for (const file of pngs) {
    console.log(`\n${file}`);
    try {
      await convertOne(file);
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
