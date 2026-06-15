/**
 * Test Environment — Verifikasi konektivitas Cloudflare D1 dan R2.
 *
 * Memeriksa apakah semua environment variables untuk D1 database dan
 * R2 storage sudah tersedia dan koneksi berfungsi dengan benar.
 *
 * @module scripts/cloudflare/test-env
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { getMissingD1EnvKeys, isD1Configured, queryD1 } from '../../src/lib/cloudflareD1';
import { getMissingR2EnvKeys, isR2StorageConfigured } from '../../src/lib/r2Storage';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms)),
  ]);
}

async function main() {
  const requiredKeys = [
    'CLOUDFLARE_D1_DATABASE_ID',
    'CLOUDFLARE_D1_API_TOKEN',
    'DATA_BACKEND',
    'NEXT_PUBLIC_DATA_BACKEND',
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET',
    'CLOUDFLARE_R2_PUBLIC_BASE_URL',
  ];

  console.log('Env keys:');
  for (const key of requiredKeys) {
    console.log(`- ${key}: ${process.env[key] ? 'present' : 'missing'}`);
  }

  if (!isD1Configured()) {
    throw new Error(
      `Cloudflare D1 env is incomplete. Missing: ${getMissingD1EnvKeys().join(', ')}`
    );
  }

  if (!isR2StorageConfigured()) {
    throw new Error(
      `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`
    );
  }

  const d1Rows = await withTimeout(
    queryD1<{ count: number }>('SELECT COUNT(*) as count FROM app_kv'),
    15000,
    'D1 query'
  );

  console.log(`D1: connected, app_kv rows=${d1Rows[0]?.count ?? 0}`);
  console.log('R2: configured');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
