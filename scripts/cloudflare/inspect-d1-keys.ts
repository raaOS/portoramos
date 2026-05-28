#!/usr/bin/env tsx
/**
 * Lists all D1 keys and shows whether content/about lives at a top-level
 * row "content/about" or nested inside a top-level "content" key. The
 * difference matters because writes go through `db.ref(...).set()` which
 * splits paths on "/", but reads via `getD1Value('content/about')` use
 * the full string as the key.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { getAllD1Values, getD1Value } from '../../src/lib/cloudflareD1';

interface MaybeNested {
  about?: { wallpaperConfig?: { collection?: unknown[] } };
  [key: string]: unknown;
}

async function main() {
  const all = await getAllD1Values();
  const keys = Object.keys(all).sort();
  console.log(`D1 keys (${keys.length}):`);
  for (const k of keys) {
    console.log('  -', k);
  }

  console.log('');

  // Two possible storage shapes:
  const direct = await getD1Value<{ wallpaperConfig?: { collection?: unknown[] } }>(
    'content/about'
  );
  const nested = await getD1Value<MaybeNested>('content');

  const directLen = direct?.wallpaperConfig?.collection?.length ?? null;
  const nestedLen = nested?.about?.wallpaperConfig?.collection?.length ?? null;

  console.log('content/about (direct row): collection length =', directLen);
  console.log('content        (nested)   : about.wallpaperConfig.collection length =', nestedLen);

  // Also dump nested.about.wallpaperConfig if present, for clarity.
  if (nested?.about?.wallpaperConfig) {
    console.log('\nNested wallpaperConfig:');
    console.log(JSON.stringify(nested.about.wallpaperConfig, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
