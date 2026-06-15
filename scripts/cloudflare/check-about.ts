/**
 * Check About — Inspeksi data about yang tersimpan di D1.
 * @module scripts/cloudflare/check-about
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { getD1Value } from '../../src/lib/cloudflareD1';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const about = await getD1Value<any>('content');
  if (about && about.about && about.about.wallpaperConfig) {
    console.log('WALLPAPER CONFIG:', JSON.stringify(about.about.wallpaperConfig, null, 2));
  } else if (about && about.wallpaperConfig) {
    console.log('WALLPAPER CONFIG:', JSON.stringify(about.wallpaperConfig, null, 2));
  } else {
    console.log('No wallpaper config found. Keys in about:', about ? Object.keys(about) : 'null');
    if (about && about.about) {
      console.log('Keys in about.about:', Object.keys(about.about));
    }
  }
}

main().catch(console.error);
