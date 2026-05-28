#!/usr/bin/env tsx
/**
 * Migrasi data legacy di Cloudflare D1.
 *
 * Latar belakang:
 *   `db.ref('content/<name>').set(...)` di src/lib/database.ts memparse
 *   path lalu menulis ke key parent ("content") dengan field nested
 *   "<name>". Read via `db.ref('content/<name>').once('value')` lewat
 *   path yang sama, sehingga UI dan service konsisten.
 *
 *   Tapi historisnya beberapa script CLI (mis. fix-wallpaper-urls.ts
 *   versi awal) menulis langsung ke `setD1Value('content/<name>', ...)`,
 *   yang menciptakan row literal terpisah. Hasilnya D1 punya dua tempat
 *   berisi data yang berbeda untuk content yang sama.
 *
 *   Source of truth yang dipakai UI adalah row "content" (nested).
 *   Script ini menghapus row literal "content/<x>" yang duplikat
 *   sehingga read mentah `getD1Value` tidak lagi nunjuk ke data stale.
 *
 * Run:
 *   npx tsx scripts/cloudflare/migrate-legacy-content-rows.ts            (dry-run)
 *   npx tsx scripts/cloudflare/migrate-legacy-content-rows.ts --apply    (eksekusi)
 *   npx tsx scripts/cloudflare/migrate-legacy-content-rows.ts --apply --yes
 */

import { config as loadEnv } from 'dotenv';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import {
  getAllD1Values,
  getD1Value,
  deleteD1Value,
  isD1Configured,
  getMissingD1EnvKeys,
} from '../../src/lib/cloudflareD1';

interface ContentBag {
  [key: string]: unknown;
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

interface DupRow {
  literalKey: string;
  nestedField: string;
  literalSize: number;
  nestedSize: number;
  contentEqual: boolean;
}

async function findDuplicates(): Promise<DupRow[]> {
  const all = await getAllD1Values();
  const keys = Object.keys(all);

  // The nested view: row "content" (object) where each field is a content domain.
  const contentBag = (all['content'] as ContentBag | undefined) || {};
  const nestedFields = new Set(Object.keys(contentBag));

  // Literal rows that look like "content/<name>" where the field also
  // exists nested under the "content" row.
  const dups: DupRow[] = [];
  for (const key of keys) {
    if (!key.startsWith('content/')) continue;
    const name = key.slice('content/'.length);
    if (!name || name.includes('/')) continue;
    if (!nestedFields.has(name)) continue;

    const literalValue = all[key];
    const nestedValue = contentBag[name];

    // Compare canonically — JSON.stringify alone is field-order
    // sensitive, which would flag two semantically identical objects
    // as conflicting just because the keys were inserted in a
    // different order on each side.
    const literalCanonical = canonicalJson(literalValue);
    const nestedCanonical = canonicalJson(nestedValue);

    dups.push({
      literalKey: key,
      nestedField: name,
      literalSize: JSON.stringify(literalValue).length,
      nestedSize: JSON.stringify(nestedValue).length,
      contentEqual: literalCanonical === nestedCanonical,
    });
  }

  return dups;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = obj[k];
          return acc;
        }, {});
    }
    return val;
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const force = args.has('--force');
  const skipConfirm = args.has('--yes') || args.has('-y');

  if (!isD1Configured()) {
    console.error('D1 env tidak lengkap. Missing:', getMissingD1EnvKeys().join(', '));
    process.exit(1);
  }

  const dups = await findDuplicates();

  if (dups.length === 0) {
    console.log('Tidak ada duplikasi content row di D1.');
    return;
  }

  console.log(`Ditemukan ${dups.length} duplikasi:`);
  for (const d of dups) {
    const eq = d.contentEqual ? 'identik' : 'BERBEDA';
    console.log(
      `  - ${d.literalKey} (literal ${d.literalSize}b) vs content.${d.nestedField} (nested ${d.nestedSize}b) — isi ${eq}`
    );
  }

  // For domains where content differs, we surface the difference and
  // refuse to auto-delete — unless --force is passed. The nested row
  // is the authoritative source because UI and /api/about always write
  // through it, but a conflict is still worth a manual look first.
  const conflicting = dups.filter((d) => !d.contentEqual);
  if (conflicting.length > 0) {
    console.log('');
    console.log('PERINGATAN: row berikut isinya berbeda. Tampilkan keduanya untuk review.');
    for (const d of conflicting) {
      const literal = await getD1Value(d.literalKey);
      const nested = (await getD1Value('content')) as ContentBag | null;
      console.log(`\n=== ${d.literalKey} (literal, akan dihapus dengan --force) ===`);
      console.log(JSON.stringify(literal, null, 2).slice(0, 1500));
      console.log(`\n=== content.${d.nestedField} (nested, source of truth) ===`);
      console.log(JSON.stringify(nested?.[d.nestedField] ?? null, null, 2).slice(0, 1500));
    }
    console.log('');
    if (!force) {
      console.log(
        'Migrasi default cuma jalan untuk row yang identik. Tambahkan --force ' +
          'kalau memang yakin nested adalah source of truth (default UI/API ' +
          'selalu lewat nested).'
      );
    }
  }

  const safeToDrop = force ? dups : dups.filter((d) => d.contentEqual);
  if (safeToDrop.length === 0) {
    process.exitCode = 1;
    return;
  }

  console.log('');
  if (force && conflicting.length > 0) {
    console.log(
      `--force aktif: akan menghapus ${safeToDrop.length} row literal ` +
        `(termasuk ${conflicting.length} yang isinya berbeda).`
    );
  } else {
    console.log(
      `Akan menghapus ${safeToDrop.length} row literal (isinya identik dengan nested):`
    );
  }
  for (const d of safeToDrop) console.log(`  - ${d.literalKey}`);

  if (!apply) {
    console.log('\n(dry-run) Tambah --apply untuk eksekusi.');
    if (conflicting.length > 0 && !force) process.exitCode = 1;
    return;
  }

  if (!skipConfirm) {
    const ok = await confirmPrompt('\nLanjut hapus row literal?');
    if (!ok) {
      console.log('Dibatalkan.');
      return;
    }
  }

  let deleted = 0;
  let failed = 0;
  for (const d of safeToDrop) {
    try {
      await deleteD1Value(d.literalKey);
      console.log(`  ✓ deleted ${d.literalKey}`);
      deleted++;
    } catch (e) {
      console.error(`  ✗ failed ${d.literalKey}: ${(e as Error).message}`);
      failed++;
    }
  }

  const skipped = force ? 0 : conflicting.length;
  console.log(`\nDone. deleted=${deleted}, failed=${failed}, conflicting-skipped=${skipped}`);
  if (failed > 0 || skipped > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
