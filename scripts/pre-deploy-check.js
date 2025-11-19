#!/usr/bin/env node

console.log('🔍 Running pre-deployment checks...\n');

// Check required files
const requiredFiles = [
  'next.config.mjs',
  'package.json',
  'tsconfig.json',
  '.env'
];

// Check required env variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SITE_URL'
];

// Check for build output
const buildFiles = [
  '.next/static',
  '.next/server',
  '.next/types'
];

function checkFiles(files) {
  const fs = require('fs');
  const missing = files.filter(file => !fs.existsSync(file));
  return missing;
}

// Run checks
console.log('📁 Checking required files...');
const missingFiles = checkFiles(requiredFiles);
if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles);
  process.exit(1);
}
console.log('✅ All required files present\n');

console.log('🔐 Checking environment variables...');
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}
console.log('✅ All required environment variables present\n');

console.log('📦 Checking build output...');
const missingBuildFiles = checkFiles(buildFiles);
if (missingBuildFiles.length > 0) {
  console.warn('⚠️ Build files missing. Running build...');
  require('child_process').execSync('npm run build', { stdio: 'inherit' });
} else {
  console.log('✅ Build files present\n');
}

console.log('🎉 All checks passed! Ready for deployment.');
