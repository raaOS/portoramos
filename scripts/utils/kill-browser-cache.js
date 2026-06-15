#!/usr/bin/env node

/**
 * Kill Browser Cache — Bersihkan cache server & restart dev server
 * ================================================================
 * Membersihkan cache Next.js, webpack, TypeScript, dan SWC,
 * lalu restart dev server. Tidak membunuh proses Node secara global.
 *
 * Catatan: Nama "browser cache" adalah legacy — script ini sebenarnya
 * membersihkan server-side cache (.next, webpack, dll).
 * Untuk membersihkan browser cache, gunakan DevTools > Application > Clear Storage.
 *
 * Penggunaan:
 *   node scripts/utils/kill-browser-cache.js           # Interactive
 *   node scripts/utils/kill-browser-cache.js --yes     # Skip konfirmasi
 *   node scripts/utils/kill-browser-cache.js --dry-run # Preview saja
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { spawn } = require('child_process');
const readline = require('readline');

const args = process.argv.slice(2);
const SKIP_CONFIRM = args.includes('--yes') || args.includes('-y');
const DRY_RUN = args.includes('--dry-run');

/**
 * Prompt user untuk konfirmasi.
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
 * Stop dev server secara targeted menggunakan kill-port atau platform-specific approach.
 */
function stopDevServer() {
  const isWindows = process.platform === 'win32';

  try {
    execSync('npx kill-port 3000 3100', { stdio: 'ignore', timeout: 10000 });
    console.log('   ✅ Dev server stopped');
  } catch {
    try {
      if (isWindows) {
        const result = execSync(
          'powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"',
          { encoding: 'utf8', stdio: 'pipe', timeout: 5000 }
        ).trim();
        if (result) {
          result
            .split('\n')
            .filter(Boolean)
            .forEach((pid) => {
              try {
                execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', timeout: 5000 });
              } catch {
                /* ok */
              }
            });
          console.log('   ✅ Dev server stopped via taskkill');
        } else {
          console.log('   ℹ️  No dev server found on port 3000');
        }
      } else {
        execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null', { stdio: 'ignore', timeout: 5000 });
        console.log('   ✅ Dev server stopped');
      }
    } catch {
      console.log('   ℹ️  No dev server detected');
    }
  }
}

async function main() {
  console.log('🔥 KILL SERVER CACHE — Clean cache & restart dev server');
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('🔍 DRY-RUN MODE — no files will be modified\n');
  }

  const proceed = await confirm(
    'Ini akan menghapus cache server dan restart dev server. Lanjutkan?'
  );

  if (!proceed) {
    console.log('❌ Dibatalkan oleh user.');
    return;
  }

  // Step 1: Stop dev server (targeted)
  if (!DRY_RUN) {
    console.log('\n🛑 Stopping dev server...');
    stopDevServer();
  } else {
    console.log('\n🔍 [DRY-RUN] Would stop dev server on port 3000/3100');
  }

  // Step 2: Clean cache directories
  const projectRoot = process.cwd();
  const cacheDirs = ['.next', 'node_modules/.cache', '.turbo', '.swc'];

  console.log('\n📂 Cleaning cache directories...');
  for (const dir of cacheDirs) {
    const fullPath = path.resolve(projectRoot, dir);
    const relative = path.relative(projectRoot, fullPath);

    // Safety: ensure path stays within project root
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

  // Step 3: Clear TypeScript cache
  if (!DRY_RUN) {
    console.log('\n🔧 Clearing TypeScript build cache...');
    try {
      execSync('npx tsc --build --clean', { stdio: 'inherit', timeout: 15000 });
    } catch {
      console.log('   ⚠️  TypeScript cache clear failed (non-critical)');
    }
  }

  // Step 4: Restart dev server (non-blocking, detached)
  if (!DRY_RUN) {
    console.log('\n🚀 Starting dev server (detached)...');
    console.log('💡 IMPORTANT: Hard refresh browser (Ctrl+Shift+R) after server starts');
    console.log(
      '💡 IMPORTANT: Open DevTools > Network > Disable cache for thorough browser cache clear'
    );

    const child = spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'inherit',
      shell: true,
    });
    child.unref();

    console.log(`   ✅ Dev server started (PID: ${child.pid})`);
    console.log('\n✅ CACHE KILLED — dev server is restarting!');
  } else {
    console.log('\n🔍 [DRY-RUN] Would start: npm run dev');
    console.log('\n✅ DRY-RUN completed — no changes were made');
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
