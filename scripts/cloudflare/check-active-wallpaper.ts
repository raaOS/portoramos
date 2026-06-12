/**
 * Check Active Wallpaper — Inspeksi wallpaper yang sedang aktif.
 * @module scripts/cloudflare/check-active-wallpaper
 */
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { aboutService } from '../../src/lib/services/aboutService';
import { headR2Object } from '../../src/lib/r2Storage';
import { extractStoragePath } from '../../src/lib/urlResolver';

async function checkActiveWallpaper() {
  const aboutData = await aboutService.getAboutData(true);
  const activeId = aboutData?.wallpaperConfig?.activeWallpaperId;
  const collection = aboutData?.wallpaperConfig?.collection || [];

  const active = collection.find((w: any) => w.id === activeId);
  if (!active) {
    console.log('No active wallpaper found in collection!');
    return;
  }

  console.log('Active Wallpaper details:');
  console.log(JSON.stringify(active, null, 2));

  const urlPath = extractStoragePath(active.url);
  const posterPath = active.posterUrl ? extractStoragePath(active.posterUrl) : null;

  if (urlPath) {
    try {
      await headR2Object(urlPath);
      console.log(`Video R2 Object exists: ${urlPath}`);
    } catch (e: any) {
      console.log(`Video R2 Object MISSING: ${urlPath}. Error: ${e.message}`);
    }
  }

  if (posterPath) {
    try {
      await headR2Object(posterPath);
      console.log(`Poster R2 Object exists: ${posterPath}`);
    } catch (e: any) {
      console.log(`Poster R2 Object MISSING: ${posterPath}. Error: ${e.message}`);
    }
  }
}

checkActiveWallpaper().catch(console.error);
