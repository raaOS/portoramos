/**
 * Recover Wallpapers — Pemulihan data wallpaper di D1 dari R2.
 * @module scripts/cloudflare/recover-wallpapers
 */
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { listR2ObjectKeys, buildR2PublicUrl } from '../../src/lib/r2Storage';
import { aboutService } from '../../src/lib/services/aboutService';
import type { Wallpaper, WallpaperConfig } from '../../src/types/about';

const PREFIX = 'assets/wallpapers/';

// Helper to format clean names from filenames
function cleanNameFromFilename(filename: string): string {
  // Strip extension
  let base = filename.replace(/\.[^.]+$/, '');
  // Strip leading directory paths if any
  base = base.split('/').pop() || base;
  // Strip timestamp prefix if any (e.g., 1780086176924-)
  base = base.replace(/^\d+-/, '');
  // Strip common suffixes
  base = base.replace(/-3840x2160/i, '');
  base = base.replace(/-1920x1080/i, '');
  base = base.replace(/-wallsflow-com/i, '');
  base = base.replace(/-live-wallpaper/i, '');
  base = base.replace(/-wallpaper/i, '');
  base = base.replace(/-50s-upload-safe/i, '');
  base = base.replace(/wallaper/i, 'Wallpaper');

  // Convert hyphens and underscores to spaces
  base = base.replace(/[-_]+/g, ' ');

  // Capitalize each word
  return base
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

async function main() {
  console.log('🔄 Memulai pemulihan data wallpaper dari R2 ke D1...');

  // 1. Ambil semua file di R2 prefix `assets/wallpapers/`
  const keys = await listR2ObjectKeys({ prefix: PREFIX });
  console.log(`📁 Ditemukan ${keys.length} files di R2.`);

  // 2. Filter mp4/webm/mov (video) dan gambar mandiri
  const videoKeys = keys.filter((key) => /\.(mp4|webm|mov)$/i.test(key));
  const imageKeys = keys.filter((key) => /\.(jpg|jpeg|png|webp|avif)$/i.test(key));

  const collection: Wallpaper[] = [];

  // 3. Rekonstruksi video wallpapers
  for (const videoKey of videoKeys) {
    const baseWithoutExt = videoKey.replace(/\.(mp4|webm|mov)$/i, '');

    // Cari poster pendamping (JPG/WebP dengan base name yang sama)
    const posterKey = imageKeys.find(
      (imgKey) => imgKey.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '') === baseWithoutExt
    );

    const filename = videoKey.split('/').pop() || '';
    const cleanName = cleanNameFromFilename(filename);

    const timestampMatch = videoKey.match(/assets\/wallpapers\/(\d+)-/);
    const id = timestampMatch
      ? `w-${timestampMatch[1]}`
      : `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    collection.push({
      id,
      url: buildR2PublicUrl(videoKey),
      name: cleanName || 'Custom Video Wallpaper',
      posterUrl: posterKey ? buildR2PublicUrl(posterKey) : undefined,
    });
  }

  // 4. Cari gambar mandiri (bukan poster video)
  for (const imageKey of imageKeys) {
    const baseWithoutExt = imageKey.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');

    // Jika ada video dengan base name yang sama, ini adalah poster, bukan gambar mandiri
    const isPoster = videoKeys.some(
      (vidKey) => vidKey.replace(/\.(mp4|webm|mov)$/i, '') === baseWithoutExt
    );
    if (isPoster) continue;

    // Jika ini adalah preview/thumbnail video yang di-generate custom path, skip
    if (imageKey.endsWith('-preview.mp4') || imageKey.includes('-preview')) continue;

    const filename = imageKey.split('/').pop() || '';
    const cleanName = cleanNameFromFilename(filename);

    const timestampMatch = imageKey.match(/assets\/wallpapers\/(\d+)-/);
    const id = timestampMatch
      ? `w-${timestampMatch[1]}`
      : `w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    collection.push({
      id,
      url: buildR2PublicUrl(imageKey),
      name: cleanName || 'Custom Wallpaper',
    });
  }

  console.log(`📋 Reconstructed ${collection.length} wallpapers:`);
  for (const wp of collection) {
    console.log(`  - [${wp.id}] Name: "${wp.name}"`);
    console.log(`    URL: ${wp.url}`);
    if (wp.posterUrl) {
      console.log(`    Poster: ${wp.posterUrl}`);
    }
  }

  if (collection.length === 0) {
    console.log('⚠️ Tidak ada wallpaper yang berhasil direkonstruksi. Keluar.');
    return;
  }

  // 5. Ambil data about saat ini
  const currentAbout = await aboutService.getAboutData(true);
  const currentConfig = currentAbout.wallpaperConfig || {
    activeWallpaperId: '',
    collection: [],
    blur: 0,
  };

  // 6. Tentukan activeWallpaperId
  // Jika activeWallpaperId saat ini masih ada di collection baru, pertahankan.
  // Jika tidak, pasang ke video wallpaper pertama yang tersedia.
  let nextActiveId = currentConfig.activeWallpaperId;
  const activeExists = collection.some(
    (wp) =>
      wp.id === nextActiveId ||
      wp.url === currentConfig.collection?.find((w: any) => w.id === nextActiveId)?.url
  );

  if (!activeExists) {
    // Pilih video wallpaper pertama jika ada
    const firstVideo = collection.find((wp) => wp.url.endsWith('.mp4'));
    nextActiveId = firstVideo ? firstVideo.id : collection[0].id;
  } else {
    // Cari id baru jika URL cocok tapi ID-nya berubah di mapping R2
    const matchingNewWp = collection.find(
      (wp) => wp.url === currentConfig.collection?.find((w: any) => w.id === nextActiveId)?.url
    );
    if (matchingNewWp) {
      nextActiveId = matchingNewWp.id;
    }
  }

  const nextConfig: WallpaperConfig = {
    ...currentConfig,
    activeWallpaperId: nextActiveId,
    collection,
  };

  // 7. Update ke D1
  console.log(`💾 Menyimpan ke D1... Active ID: ${nextActiveId}`);
  const updated = await aboutService.updateAboutData({
    wallpaperConfig: nextConfig,
  });

  console.log('✅ Pemulihan sukses! Database D1 tersinkronisasi kembali.');
}

main().catch((error) => {
  console.error('❌ Gagal memulihkan wallpaper:', error);
  process.exit(1);
});
