#!/usr/bin/env tsx
/**
 * Audit + opsional cleanup file orphan di Cloudflare R2 prefix
 * `assets/projects/`. Mirip audit-orphan-wallpapers tapi domainnya
 * project assets (cover, gallery, comparison before/after, dst).
 *
 * Behavior:
 *  - Read semua project via `projectService.getProjects(undefined, true)`
 *    untuk konsisten dengan UI admin.
 *  - Kumpulkan referensi via `extractProjectAssets`.
 *  - Diff dengan listing R2 prefix `assets/projects/`.
 *  - Default report-only. `--delete-orphans` menghapus.
 *
 * Run:
 *   npx tsx scripts/cloudflare/audit-orphan-projects.ts
 *   npx tsx scripts/cloudflare/audit-orphan-projects.ts --json
 *   npx tsx scripts/cloudflare/audit-orphan-projects.ts --delete-orphans
 *   npx tsx scripts/cloudflare/audit-orphan-projects.ts --delete-orphans --yes
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
import { projectService } from '../../src/lib/services/projectService';
import { extractProjectAssets } from '../../src/lib/services/project/projectStorage';

const PREFIX = 'assets/projects/';

interface ReportRow {
  key: string;
  reason: 'orphan';
}

interface DanglingRow {
  projectId: string;
  slug?: string;
  url: string;
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

  const { projects } = await projectService.getProjects(undefined, true);

  const referencedKeys = new Set<string>();
  const refByProject: Array<{ id: string; slug?: string; url: string; key: string }> = [];

  for (const p of projects) {
    const urls = extractProjectAssets(p);
    for (const url of urls) {
      const key = extractStoragePath(url);
      if (!key) continue;

      referencedKeys.add(key);
      refByProject.push({ id: p.id, slug: p.slug, url, key });

      // For video assets the upload pipeline also writes side-car
      // files with predictable names. Poster bisa `.jpg` (server
      // ffmpeg → mjpeg) atau `.webp` (server sharp transcode dari
      // client-captured JPG di flow direct-to-R2). Preview clip
      // (`<base>-preview.mp4`) hanya muncul kalau pipeline tidak
      // skipPreview. Track semua varian yang mungkin sebagai
      // referenced supaya cleanup tidak menghapus side-car yang
      // beneran terpakai.
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
  const r2KeySet = new Set(r2Keys);

  const orphans: ReportRow[] = r2Keys
    .filter((key) => !referencedKeys.has(key))
    .map((key) => ({ key, reason: 'orphan' as const }));

  const dangling: DanglingRow[] = [];
  for (const ref of refByProject) {
    if (!ref.key.startsWith(PREFIX)) continue;
    if (!r2KeySet.has(ref.key)) {
      dangling.push({
        projectId: ref.id,
        slug: ref.slug,
        url: ref.url,
        resolvedKey: ref.key,
      });
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
      console.log(`  - project ${row.projectId} (${row.slug ?? '?'}): ${row.url}`);
    }
  }
}

async function confirmPrompt(question: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function deleteOrphans(orphans: ReportRow[], skipConfirm: boolean) {
  if (orphans.length === 0) {
    console.log('Tidak ada orphan untuk dihapus.');
    return;
  }

  console.log(`Akan menghapus ${orphans.length} object dari R2:`);
  for (const row of orphans) console.log(`  - ${row.key}`);

  if (!skipConfirm) {
    const ok = await confirmPrompt('Lanjut hapus permanen?');
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
    await deleteOrphans(result.orphans, skipConfirm);
  }

  if (!wantDelete && (result.orphans.length > 0 || result.dangling.length > 0)) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
