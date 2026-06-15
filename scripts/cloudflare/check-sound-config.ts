/**
 * Check Sound Config — Inspeksi konfigurasi suara desktop di D1.
 * @module scripts/cloudflare/check-sound-config
 */
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from '../../src/lib/database';

async function checkSound() {
  const ref = db.ref('content/about');
  const snap = await ref.once('value');
  const val = snap.val();
  console.log('--- content/about soundConfig ---');
  if (val && val.soundConfig) {
    console.log(JSON.stringify(val.soundConfig, null, 2));
  } else {
    console.log('No soundConfig field found in content/about.');
  }

  const contentRef = db.ref('content');
  const contentSnap = await contentRef.once('value');
  const contentVal = contentSnap.val();
  console.log('--- content.about soundConfig ---');
  if (contentVal && contentVal.about && contentVal.about.soundConfig) {
    console.log(JSON.stringify(contentVal.about.soundConfig, null, 2));
  } else {
    console.log('No soundConfig field found in content.about.');
  }
}

checkSound().catch(console.error);
