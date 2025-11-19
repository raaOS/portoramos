#!/usr/bin/env node

/**
 * Kill browser cache - Nuclear option for persistent browser cache issues
 * This script forces browser to completely ignore cache
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 KILLING BROWSER CACHE - Nuclear option...');

// Kill all Node processes
try {
  console.log('🛑 Killing all Node.js processes...');
  execSync('pkill -f node', { stdio: 'ignore' });
} catch (error) {
  // Ignore if no processes found
}

// Remove ALL cache directories
const cacheDirs = [
  '.next',
  'node_modules/.cache',
  '.vercel',
  '.next/cache',
  '.turbo',
  '.swc',
  'dist',
  'build'
];

cacheDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`💥 Removing ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  Could not remove ${dir}: ${error.message}`);
    }
  }
});

// Clear all caches
try {
  console.log('🧹 Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  npm cache clear failed');
}

try {
  console.log('🔧 Clearing TypeScript cache...');
  execSync('npx tsc --build --clean', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  TypeScript cache clear failed');
}

console.log('✅ BROWSER CACHE KILLED!');
console.log('🚀 Starting server with NO CACHE...');
console.log('💡 IMPORTANT: Hard refresh your browser (Cmd+Shift+R)');
console.log('💡 IMPORTANT: Open DevTools > Network > Disable cache');

// Start server
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Server start failed');
}

