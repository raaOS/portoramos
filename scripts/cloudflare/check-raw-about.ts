/**
 * Check Raw About — Inspeksi data mentah about dari database D1.
 * @module scripts/cloudflare/check-raw-about
 */
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../../src/lib/database';

async function checkRawAbout() {
  const ref = db.ref('content/about');
  const snap = await ref.once('value');
  console.log('Raw content/about snapshot exists:', snap.exists());
  console.log('Raw content/about value:', JSON.stringify(snap.val(), null, 2));

  const contentRef = db.ref('content');
  const contentSnap = await contentRef.once('value');
  console.log('Raw content snapshot exists:', contentSnap.exists());
  const val = contentSnap.val();
  console.log('Raw content key about exists:', val && 'about' in val);
  if (val && 'about' in val) {
    console.log(
      'Raw content.about.wallpaperConfig:',
      JSON.stringify((val as any).about.wallpaperConfig, null, 2)
    );
  }
}

checkRawAbout().catch(console.error);
