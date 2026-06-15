#!/usr/bin/env node

/**
 * Ultra Clean Script — Nuclear option untuk persistent cache issues
 * ================================================================
 * Script ini mereset seluruh development environment secara menyeluruh.
 *
 * PERINGATAN: Script ini menghapus semua cache dan reinstall dependencies.
 * Pastikan tidak ada file penting yang belum di-commit.
 *
 * Penggunaan:
 *   node scripts/utils/ultra-clean.js           # Interactive (meminta konfirmasi)
 *   node scripts/utils/ultra-clean.js --yes     # Skip konfirmasi (untuk CI)
 *   node scripts/utils/ultra-clean.js --dry-run # Preview saja, jangan hapus apapun
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const args = process.argv.slice(2);
const SKIP_CONFIRM = args.includes('--yes') || args.includes('-y');
const DRY_RUN = args.includes('--dry-run');

/**
 * Prompt user untuk konfirmasi interaktif.
 * @param {string} question
 * @returns {Promise<boolean>}
 */
function confirm(question) {
  if (SKIP_CONFIRM) return Promise.resolve(true);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Kill proses Next.js yang berjalan di port 3000/3100 secara targeted.
 * Cross-platform: menggunakan kill-port jika tersedia, fallback ke taskkill/pkill.
 */
function killDevServer() {
  const isWindows = process.platform === 'win32';

  try {
    // Coba kill-port terlebih dahulu (cross-platform, targeted)
    console.log('🛑 Stopping dev server (port 3000, 3100)...');
    execSync('npx kill-port 3000 3100', { stdio: 'ignore', timeout: 10000 });
    console.log('   ✅ Dev server stopped via kill-port');
  } catch {
    // Fallback: platform-specific process kill
    try {
      if (isWindows) {
        // Windows: kill node processes listening on port 3000
        const result = execSync(
          'powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"',
          { encoding: 'utf8', stdio: 'pipe', timeout: 5000 }
        ).trim();
        if (result) {
          const pids = result.split('\n').filter(Boolean);
          for (const pid of pids) {
            try {
              execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', timeout: 5000 });
            } catch {
              // Process may already be gone
            }
          }
          console.log('   ✅ Dev server stopped via taskkill');
        } else {
          console.log('   ℹ️  No process found on port 3000');
        }
      } else {
        // Unix: use lsof to find and kill
        execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null', { stdio: 'ignore', timeout: 5000 });
        console.log('   ✅ Dev server stopped via lsof');
      }
    } catch {
      console.log('   ℹ️  No dev server detected on port 3000/3100');
    }
  }
}

/**
 * Hapus direktori cache yang aman (hanya di dalam project root).
 * @param {string[]} dirs - Daftar relatif path direktori cache
 */
function cleanCacheDirs(dirs) {
  const projectRoot = process.cwd();

  for (const dir of dirs) {
    // Safety: pastikan path tidak keluar dari project root
    const fullPath = path.resolve(projectRoot, dir);
    const relative = path.relative(projectRoot, fullPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      console.log(`   ⚠️  SKIPPED ${dir} — path escapes project root`);
      continue;
    }

    if (fs.existsSync(fullPath)) {
      if (DRY_RUN) {
        console.log(`   🔍 [DRY-RUN] Would remove: ${dir}`);
      } else {
        console.log(`   💥 Removing ${dir}...`);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (error) {
          console.log(`   ⚠️  Could not remove ${dir}: ${error.message}`);
        }
      }
    }
  }
}

async function main() {
  console.log('🧨 ULTRA CLEAN — Nuclear option for cache issues');
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('🔍 DRY-RUN MODE — no files will be modified\n');
  }

  // Konfirmasi
  const proceed = await confirm(
    'Ini akan menghapus semua cache dan reinstall dependencies. Lanjutkan?'
  );

  if (!proceed) {
    console.log('❌ Dibatalkan oleh user.');
    return;
  }

  // Step 1: Stop dev server (targeted, bukan kill semua Node)
  if (!DRY_RUN) {
    killDevServer();
  } else {
    console.log('\n🔍 [DRY-RUN] Would stop dev server on port 3000/3100');
  }

  // Step 2: Hapus cache directories
  console.log('\n📂 Cleaning cache directories...');
  const cacheDirs = ['.next', 'node_modules/.cache', '.vercel', '.turbo', '.swc'];

  cleanCacheDirs(cacheDirs);

  // Step 3: Clear package manager cache
  console.log('\n🧹 Clearing package manager cache...');
  if (!DRY_RUN) {
    try {
      execSync('npm cache clean --force', { stdio: 'inherit', timeout: 30000 });
      console.log('   ✅ npm cache cleared');
    } catch {
      console.log('   ⚠️  npm cache clear failed (non-critical)');
    }
  } else {
    console.log('   🔍 [DRY-RUN] Would run: npm cache clean --force');
  }

  // Step 4: Clear TypeScript build cache
  console.log('\n🔧 Clearing TypeScript build cache...');
  if (!DRY_RUN) {
    try {
      execSync('npx tsc --build --clean', { stdio: 'inherit', timeout: 15000 });
      console.log('   ✅ TypeScript cache cleared');
    } catch {
      console.log('   ⚠️  TypeScript cache clear failed (non-critical)');
    }
  } else {
    console.log('   🔍 [DRY-RUN] Would run: npx tsc --build --clean');
  }

  // Step 5: Reinstall dependencies
  console.log('\n📦 Reinstalling dependencies...');
  if (!DRY_RUN) {
    try {
      execSync('npm install', { stdio: 'inherit', timeout: 120000 });
      console.log('   ✅ Dependencies reinstalled');
    } catch {
      console.log('   ⚠️  npm install failed — run "npm install" manually');
    }
  } else {
    console.log('   🔍 [DRY-RUN] Would run: npm install');
  }

  // Done
  console.log('\n' + '='.repeat(50));
  if (DRY_RUN) {
    console.log('✅ DRY-RUN completed — no changes were made');
    console.log('🚀 Run without --dry-run to execute: node scripts/utils/ultra-clean.js');
  } else {
    console.log('✅ ULTRA CLEAN completed!');
    console.log('🚀 You can now run: npm run dev');
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
