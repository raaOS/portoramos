#!/usr/bin/env node

/**
 * Ultra clean script - Nuclear option for persistent cache issues
 * This script completely resets the development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧨 ULTRA CLEAN - Nuclear option for cache issues...');

// Kill ALL Node processes
try {
  console.log('🛑 Killing all Node.js processes...');
  execSync('pkill -f node', { stdio: 'ignore' });
  execSync('pkill -f "node scripts/dev.js"', { stdio: 'ignore' });
} catch (error) {
  // Ignore if no processes found
}

// Wait a moment for processes to die
setTimeout(() => {
  // Remove ALL cache directories
  const cacheDirs = [
    '.next',
    'node_modules/.cache',
    '.vercel',
    '.next/cache',
    '.next/cache/webpack',
    '.next/cache/eslint',
    '.next/cache/typescript',
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

  // Reinstall dependencies to ensure clean state
  console.log('📦 Reinstalling dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  npm install failed');
  }

  console.log('✅ ULTRA CLEAN completed!');
  console.log('🚀 You can now run: npm run dev');
  console.log('💡 All caches have been completely reset');
}, 2000);
