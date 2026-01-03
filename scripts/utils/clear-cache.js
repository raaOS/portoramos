#!/usr/bin/env node

/**
 * Clear Next.js and browser cache
 * This script helps resolve 404 errors for static assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing all caches...');

// Clear Next.js cache
const nextCache = path.join(process.cwd(), '.next');
if (fs.existsSync(nextCache)) {
  console.log('📁 Removing .next directory...');
  fs.rmSync(nextCache, { recursive: true, force: true });
}

// Clear webpack cache specifically (macOS fix)
const webpackCache = path.join(process.cwd(), '.next', 'cache', 'webpack');
if (fs.existsSync(webpackCache)) {
  console.log('📁 Removing webpack cache...');
  fs.rmSync(webpackCache, { recursive: true, force: true });
}

// Clear node_modules cache
const nodeCache = path.join(process.cwd(), 'node_modules', '.cache');
if (fs.existsSync(nodeCache)) {
  console.log('📁 Removing node_modules/.cache...');
  fs.rmSync(nodeCache, { recursive: true, force: true });
}

// Clear Vercel cache
const vercelCache = path.join(process.cwd(), '.vercel');
if (fs.existsSync(vercelCache)) {
  console.log('📁 Removing .vercel directory...');
  fs.rmSync(vercelCache, { recursive: true, force: true });
}

// Clear TypeScript cache
try {
  console.log('🔧 Clearing TypeScript cache...');
  execSync('npx tsc --build --clean', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  TypeScript cache clear failed (this is usually fine)');
}

// Clear npm cache
try {
  console.log('📦 Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  npm cache clear failed (this is usually fine)');
}

console.log('✅ Cache clearing completed!');
console.log('🚀 You can now run: npm run dev');
console.log('💡 If you still see 404s, try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
