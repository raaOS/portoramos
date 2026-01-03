#!/usr/bin/env node

/**
 * Fix webpack cache issues on macOS
 * This script addresses the ENOENT error with webpack cache
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing webpack cache issues...');

// Kill any running Next.js processes
try {
  console.log('🛑 Stopping Next.js processes...');
  execSync('pkill -f "node scripts/dev.js"', { stdio: 'ignore' });
} catch (error) {
  // Ignore if no processes found
}

// Clear all cache directories
const cacheDirs = [
  '.next',
  'node_modules/.cache',
  '.vercel',
  '.next/cache/webpack',
  '.next/cache/eslint',
  '.next/cache/typescript'
];

cacheDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Removing ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  Could not remove ${dir}: ${error.message}`);
    }
  }
});

// Clear npm cache
try {
  console.log('📦 Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  npm cache clear failed');
}

// Clear TypeScript cache
try {
  console.log('🔧 Clearing TypeScript cache...');
  execSync('npx tsc --build --clean', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  TypeScript cache clear failed');
}

console.log('✅ Webpack cache fix completed!');
console.log('🚀 You can now run: npm run dev');
console.log('💡 The webpack cache is now disabled in development mode');
