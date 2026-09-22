#!/usr/bin/env tsx
/**
 * Backfill `<base>.jpg` poster side-cars for existing explorer PDFs.
 *
 * For each explorer file node with fileType === 'pdf':
 *   1. Derive the R2 key for the PDF main object.
 *   2. Check if `<base>.jpg` already exists in R2 → skip if yes.
 *   3. Download the PDF from R2, render page 1 to JPEG.
 *   4. Upload the JPEG back to R2 at `<base>.jpg`.
 *   5. Update the D1 node's thumbnailKey / thumbnailUrl.
 *
 * Dry-run by default. Pass --apply to write to R2 and D1.
 *
 * Run:
 *   npx tsx scripts/cloudflare/backfill-pdf-posters.ts           # dry-run
 *   npx tsx scripts/cloudflare/backfill-pdf-posters.ts --apply
 */
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import {
  compareAndSetD1Value,
  getD1Value,
  isD1Configured,
  getMissingD1EnvKeys,
} from '../../src/lib/cloudflareD1';
import {
  buildR2PublicUrl,
  getR2Object,
  headR2Object,
  isR2StorageConfigured,
  getMissingR2EnvKeys,
  uploadToR2,
} from '../../src/lib/r2Storage';
import { extractStoragePath } from '../../src/lib/urlResolver';
import { generatePdfThumbnail } from '../../src/lib/pdfThumbnail';
import type { AnyExplorerNode, ExplorerFile } from '../../src/types/explorer';

type ExplorerRoot = { nodes?: Record<string, AnyExplorerNode> };
const EXPLORER_KEY = 'explorer';
const MAX_RETRIES = 8;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isNotFound(e: unknown): boolean {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    err?.$metadata?.httpStatusCode === 404 ||
    err?.name === 'NotFound' ||
    err?.name === 'NoSuchKey'
  );
}

async function keyExists(key: string): Promise<boolean> {
  try {
    await headR2Object(key);
    return true;
  } catch (e) {
    if (isNotFound(e)) return false;
    throw e;
  }
}

async function fetchPdfBuffer(key: string): Promise<Buffer> {
  const res = await getR2Object(key);
  const bytes = await res.Body?.transformToByteArray();
  if (!bytes) throw new Error(`Empty body for R2 key: ${key}`);
  return Buffer.from(bytes);
}

async function main() {
  const apply = process.argv.includes('--apply');

  if (!isD1Configured()) {
    console.error('D1 env tidak lengkap. Missing:', getMissingD1EnvKeys().join(', '));
    process.exit(1);
  }
  if (!isR2StorageConfigured()) {
    console.error('R2 env tidak lengkap. Missing:', getMissingR2EnvKeys().join(', '));
    process.exit(1);
  }

  const root = await getD1Value<ExplorerRoot>(EXPLORER_KEY);
  const nodes = root?.nodes || {};
  const pdfFiles = Object.values(nodes).filter(
    (n): n is ExplorerFile => n.type === 'file' && n.fileType === 'pdf'
  );

  if (pdfFiles.length === 0) {
    console.log('Tidak ada file PDF di explorer. No-op.');
    return;
  }

  console.log(`Ditemukan ${pdfFiles.length} file PDF di D1.\n`);

  let alreadyOk = 0;
  let backfilled = 0;
  let failed = 0;
  let skipped = 0;
  const updates = new Map<string, Partial<ExplorerFile>>();

  for (const file of pdfFiles) {
    const label = file.originalName || file.name;

    const mainKey = file.storageKey || extractStoragePath(file.url);
    if (!mainKey || !mainKey.toLowerCase().endsWith('.pdf')) {
      console.log(`  [skip] ${label} — key bukan PDF (${mainKey || 'missing'})`);
      skipped++;
      continue;
    }

    const existingThumb =
      file.thumbnailKey || (file.thumbnailUrl ? extractStoragePath(file.thumbnailUrl) : null);

    // Already has an explicit thumbnail that exists in R2.
    if (existingThumb) {
      try {
        if (await keyExists(existingThumb)) {
          alreadyOk++;
          continue;
        }
      } catch {
        // Fall through to regenerate.
      }
    }

    // Convention: `<base>.jpg`
    const posterKey = mainKey.replace(/\.pdf$/i, '.jpg');
    let hasPoster = false;
    try {
      hasPoster = await keyExists(posterKey);
    } catch {
      hasPoster = false;
    }

    if (hasPoster && posterKey === existingThumb) {
      alreadyOk++;
      continue;
    }

    if (!apply) {
      console.log(
        `  [would-backfill] ${label}  main=${mainKey}` +
          (hasPoster ? `  poster exists=${posterKey} (hanya update D1)` : `  render page-1 → ${posterKey}`)
      );
      backfilled++;
      continue;
    }

    try {
      if (!hasPoster) {
        console.log(`  [render] ${label} …`);
        const pdfBuffer = await fetchPdfBuffer(mainKey);
        const thumb = await generatePdfThumbnail(pdfBuffer);
        if (!thumb) {
          console.error(`  [fail] ${label} — thumbnail render returned null`);
          failed++;
          continue;
        }
        await uploadToR2({
          key: posterKey,
          body: thumb,
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000, immutable',
        });
      } else {
        console.log(`  [exists] ${posterKey} — hanya update D1 reference`);
      }

      updates.set(file.id, {
        thumbnailKey: posterKey,
        thumbnailUrl: buildR2PublicUrl(posterKey),
      });
      backfilled++;
      console.log(`  [ok] ${label} → ${posterKey}`);
    } catch (e) {
      console.error(`  [fail] ${label}:`, e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log('');
  console.log(`Already OK   : ${alreadyOk}`);
  console.log(`Backfilled   : ${backfilled}`);
  console.log(`Skipped      : ${skipped}`);
  console.log(`Failed       : ${failed}`);

  if (updates.size === 0) {
    console.log('\nNo D1 changes to write.');
    if (failed > 0) process.exitCode = 1;
    return;
  }

  if (!apply) {
    console.log('\nDry-run aktif (default). Jalankan dengan --apply untuk menulis ke R2 & D1.');
    return;
  }

  // Commit D1 node updates via compare-and-set retry loop.
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const current = await getD1Value<ExplorerRoot>(EXPLORER_KEY);
    const currentNodes = JSON.parse(JSON.stringify(current?.nodes || {})) as Record<
      string,
      AnyExplorerNode
    >;

    let changed = false;
    for (const [id, patch] of updates) {
      const node = currentNodes[id];
      if (node && node.type === 'file') {
        Object.assign(node, patch);
        node.updatedAt = new Date().toISOString();
        changed = true;
      }
    }

    if (!changed) {
      console.log('\nSemua node sudah diupdate di D1 oleh proses lain. No-op.');
      break;
    }

    const nextRoot: ExplorerRoot = { ...(current || {}), nodes: currentNodes };
    if (await compareAndSetD1Value(EXPLORER_KEY, current, nextRoot)) {
      console.log(`\nD1 updated: ${updates.size} node(s).`);
      break;
    }

    await sleep(20 * (attempt + 1));
    if (attempt === MAX_RETRIES - 1) {
      console.error('\nD1 write conflict berulang; coba lagi nanti.');
      process.exitCode = 1;
    }
  }

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
