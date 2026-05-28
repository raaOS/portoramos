#!/usr/bin/env tsx
/**
 * Print wallpaperConfig from D1, two ways:
 *  1) raw `getD1Value('content/about')` — exactly what's stored.
 *  2) `aboutService.getAboutData(true)` — the merged view that the
 *     endpoint sees (deep merge with src/data/about.json fallback).
 *
 * If the two disagree, the difference comes from the fallback merge,
 * which is what we need to know when reconciling stats.
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { getD1Value } from '../../src/lib/cloudflareD1';
import { aboutService } from '../../src/lib/services/aboutService';

interface Cfg {
  collection?: Array<{ id?: string; url?: string; posterUrl?: string }>;
}
interface AboutLike {
  wallpaperConfig?: Cfg;
  [key: string]: unknown;
}

async function main() {
  const raw = await getD1Value<AboutLike>('content/about');
  const rawCol = raw?.wallpaperConfig?.collection || [];
  console.log(`[raw D1]      collection length = ${rawCol.length}`);
  rawCol.forEach((w, i) => console.log(`  ${i}: id=${w.id} url=${w.url}`));

  console.log('');

  const merged = await aboutService.getAboutData(true);
  const mergedCol = merged?.wallpaperConfig?.collection || [];
  console.log(`[merged view] collection length = ${mergedCol.length}`);
  mergedCol.forEach((w, i) =>
    console.log(`  ${i}: id=${(w as { id?: string }).id} url=${(w as { url?: string }).url}`)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
