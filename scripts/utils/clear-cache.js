#!/usr/bin/env node

/**
 * Clear Next.js and browser cache.
 * Refuses to remove `.next` while the dev server is still running unless forced.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync } = require('child_process');

function isPortActive(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finalize = (active) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(active);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, host);
  });
}

async function main() {
  const force = process.argv.includes('--force');
  const devRunning = await isPortActive(3000);

  if (devRunning && !force) {
    console.error('Dev server terdeteksi di port 3000. Hentikan dulu sebelum menghapus cache.');
    console.error('Gunakan `npm run clear-cache -- --force` hanya jika kamu memang sengaja ingin reset state dev saat ini.');
    process.exit(1);
  }

  console.log('Clearing all caches...');

  const nextCache = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextCache)) {
    console.log('Removing .next directory...');
    fs.rmSync(nextCache, { recursive: true, force: true });
  }

  const webpackCache = path.join(process.cwd(), '.next', 'cache', 'webpack');
  if (fs.existsSync(webpackCache)) {
    console.log('Removing webpack cache...');
    fs.rmSync(webpackCache, { recursive: true, force: true });
  }

  const nodeCache = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(nodeCache)) {
    console.log('Removing node_modules/.cache...');
    fs.rmSync(nodeCache, { recursive: true, force: true });
  }

  const vercelCache = path.join(process.cwd(), '.vercel');
  if (fs.existsSync(vercelCache)) {
    console.log('Removing .vercel directory...');
    fs.rmSync(vercelCache, { recursive: true, force: true });
  }

  try {
    console.log('Clearing TypeScript cache...');
    execSync('npx tsc --build --clean', { stdio: 'inherit' });
  } catch {
    console.log('TypeScript cache clear failed (this is usually fine)');
  }

  try {
    console.log('Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch {
    console.log('npm cache clear failed (this is usually fine)');
  }

  console.log('Cache clearing completed.');
  console.log('You can now run: npm run dev');
  console.log('If you still see 404s, try hard refresh (Ctrl+Shift+R or Cmd+Shift+R).');
}

main().catch((error) => {
  console.error('Cache clearing failed:', error);
  process.exit(1);
});
