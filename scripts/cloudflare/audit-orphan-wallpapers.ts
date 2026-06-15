#!/usr/bin/env tsx
/**
 * Audit + opsional cleanup file orphan di Cloudflare R2 prefix
 * `assets/wallpapers/`. Sekaligus periksa apakah `wallpaperConfig` di D1
 * referensi URL yang object-nya sudah hilang.
 *
 * IMPORTANT — kenapa ini lewat aboutService, bukan getD1Value langsung:
 *   D1 menyimpan content/about di dua tempat (legacy bug):
 *     - row top-level "content/about" (key string literal)
 *     - row "content" dengan field nested "about"
 *   Read via `getD1Value('content/about')` cuma melihat row pertama,
 *   sedangkan `db.ref('content/about').once('value')` (yang dipakai
 *   service & UI) lewat nested path. Dua-duanya bisa berisi data yang
 *   berbeda; UI percaya yang nested. Kalau script ini pakai getD1Value
 *   langsung, kita salah klasifikasi: file yang aktif dipakai user
 *   bisa terdeteksi sebagai orphan dan dihapus.
 */

import { config as loadEnv } from 'dotenv';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { isD1Configured, getMissingD1EnvKeys } from '../../src/lib/cloudflareD1';
import {
  deleteFromR2,
  getMissingR2EnvKeys,
  isR2StorageConfigured,
  listR2ObjectKeys,
} from '../../src/lib/r2Storage';
import { extractStoragePath } from '../../src/lib/urlResolver';
import { aboutService } from '../../src/lib/services/aboutService';

const PREFIX = 'assets/wallpapers/';

interface ReportRow {
  key: string;
  reason: 'orphan';
}

interface DanglingRow {
  wallpaperId: string;
  field: 'url' | 'posterUrl';
  value: string;
  resolvedKey: string | null;
}

interface AuditResult {
  prefix: string;
  totalR2Objects: number;
  totalReferenced: number;
  orphans: ReportRow[];
  dangling: DanglingRow[];
}

async function audit(): Promise<AuditResult> {
  if (!isR2StorageConfigured()) {
    throw new Error(
      `Cloudflare R2 env tidak lengkap. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }
  if (!isD1Configured()) {
    throw new Error(
      `Cloudflare D1 env tidak lengkap. Missing: ${getMissingD1EnvKeys().join(', ')}`
    );
  }

  // Use the service so we read the same merged view that the admin UI
  // and /api/about see. See file header for why this matters.
  const about = await aboutService.getAboutData(true);
  const collection = about?.wallpaperConfig?.collection || [];

  const referencedKeys = new Set<string>();
  const dangling: DanglingRow[] = [];

  for (const w of collection) {
    for (const field of ['url', 'posterUrl'] as const) {
      const value = (w as { url?: string; posterUrl?: string })[field];
      if (!value) continue;
      const key = extractStoragePath(value);
      if (!key) continue;
      referencedKeys.add(key);

      // Match the side-car convention used by the upload pipeline:
      // every video also has `<base>-preview.mp4` (kalau pipeline
      // tidak skip preview) dan poster auto-generate. Poster bisa
      // berakhir sebagai `.jpg` (server ffmpeg) atau `.webp` (server
      // sharp transcode dari client-captured JPG). Tracking
      // ketiga-tiganya sebagai referenced supaya cleanup tidak
      // mengikis poster aktual.
      const videoMatch = key.match(/^(.*)\.(mp4|webm|mov)$/i);
      if (videoMatch) {
        const base = videoMatch[1];
        referencedKeys.add(`${base}-preview.mp4`);
        referencedKeys.add(`${base}.jpg`);
        referencedKeys.add(`${base}.webp`);
      }
    }
  }

  const r2Keys = await listR2ObjectKeys({ prefix: PREFIX });

  const orphans: ReportRow[] = r2Keys
    .filter((key) => !referencedKeys.has(key))
    .map((key) => ({ key, reason: 'orphan' as const }));

  const r2KeySet = new Set(r2Keys);
  for (const w of collection) {
    for (const field of ['url', 'posterUrl'] as const) {
      const value = (w as { url?: string; posterUrl?: string; id?: string })[field];
      if (!value) continue;
      const key = extractStoragePath(value);
      if (!key) continue;
      if (!key.startsWith(PREFIX)) continue;
      if (!r2KeySet.has(key)) {
        dangling.push({
          wallpaperId: (w as { id?: string }).id || '<no-id>',
          field,
          value,
          resolvedKey: key,
        });
      }
    }
  }

  return {
    prefix: PREFIX,
    totalR2Objects: r2Keys.length,
    totalReferenced: referencedKeys.size,
    orphans,
    dangling,
  };
}

function printHumanReport(result: AuditResult) {
  console.log(`Prefix         : ${result.prefix}`);
  console.log(`R2 objects     : ${result.totalR2Objects}`);
  console.log(`Referenced (D1): ${result.totalReferenced}`);
  console.log('');

  if (result.orphans.length === 0) {
    console.log('Orphan files   : 0  (R2 sinkron dengan D1)');
  } else {
    console.log(`Orphan files   : ${result.orphans.length}`);
    for (const row of result.orphans) console.log(`  - ${row.key}`);
  }
  console.log('');

  if (result.dangling.length === 0) {
    console.log('Dangling refs  : 0  (semua URL di D1 punya object di R2)');
  } else {
    console.log(`Dangling refs  : ${result.dangling.length}`);
    for (const row of result.dangling) {
      console.log(
        `  - wallpaper ${row.wallpaperId} ${row.field}=${row.value} (R2 key tidak ditemukan)`
      );
    }
  }
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function deleteOrphans(
  orphans: ReportRow[],
  totalR2Objects: number,
  totalReferenced: number,
  skipConfirm: boolean
) {
  if (orphans.length === 0) {
    console.log('Tidak ada orphan untuk dihapus.');
    return;
  }

  // ── Safety bail-outs ─────────────────────────────────────────────
  // Same paranoia as audit-orphan-projects. If D1 returned no
  // references (likely a read failure) or the orphan ratio is
  // implausibly high (likely a missing reference category), bail
  // out instead of nuking the bucket.
  if (totalReferenced === 0) {
    console.error(
      'ABORT: D1 returned zero references. Refusing to delete anything; investigate D1 read path first.'
    );
    process.exitCode = 2;
    return;
  }
  const ratio = totalR2Objects > 0 ? orphans.length / totalR2Objects : 0;
  const threshold = 0.2;
  if (ratio > threshold) {
    console.error(
      `ABORT: orphan ratio ${(ratio * 100).toFixed(1)}% (${orphans.length}/${totalR2Objects}) above ${threshold * 100}% safety threshold.`
    );
    console.error(
      'Investigate before deleting — may indicate audit logic missed a reference category.'
    );
    process.exitCode = 2;
    return;
  }

  console.log(`Akan menghapus ${orphans.length} object dari R2:`);
  for (const row of orphans) console.log(`  - ${row.key}`);

  if (!skipConfirm) {
    const ok = await confirm('Lanjut hapus permanen?');
    if (!ok) {
      console.log('Dibatalkan.');
      return;
    }
  }

  let deleted = 0;
  let failed = 0;
  for (const row of orphans) {
    try {
      await deleteFromR2(row.key);
      console.log(`  ✓ deleted ${row.key}`);
      deleted++;
    } catch (e) {
      console.error(`  ✗ failed ${row.key}: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. deleted=${deleted}, failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const wantJson = args.has('--json');
  const wantDelete = args.has('--delete-orphans');
  const skipConfirm = args.has('--yes') || args.has('-y');

  const result = await audit();

  if (wantJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReport(result);
  }

  if (wantDelete) {
    console.log('');
    await deleteOrphans(result.orphans, result.totalR2Objects, result.totalReferenced, skipConfirm);
  }

  if (!wantDelete && (result.orphans.length > 0 || result.dangling.length > 0)) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
