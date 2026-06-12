#!/usr/bin/env node
// Script untuk deployment ke Vercel dengan environment variables Cloudflare D1/R2
// Usage: node scripts/deploy/deploy-vercel.mjs

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Baca .env.local dan parse key-value pairs.
 * Menangani comments, quoted values, dan multi-line.
 */
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          // Strip surrounding quotes dari value
          let value = valueParts.join('=').trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          envVars[key.trim()] = value;
        }
      }
    });

    return envVars;
  } catch (error) {
    console.warn('⚠️  Could not read .env.local file:', error.message);
    return {};
  }
}

function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Deploying to Vercel — Cloudflare D1/R2 Architecture\n');

  const envVars = loadEnvFile();

  // Environment variables yang diperlukan untuk production (Cloudflare D1/R2)
  const requiredEnvVars = [
    'CLOUDFLARE_D1_DATABASE_ID',
    'CLOUDFLARE_D1_API_TOKEN',
    'CLOUDFLARE_R2_BUCKET',
    'CLOUDFLARE_R2_PUBLIC_BASE_URL',
    'JWT_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
  ];

  // Optional tapi direkomendasikan
  const optionalEnvVars = [
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CRON_SECRET',
    'JOB_BOT_TELEGRAM_TOKEN',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ];

  console.log('📋 Checking Required Environment Variables:');
  console.log('='.repeat(50));

  const missingVars = [];

  for (const varName of requiredEnvVars) {
    if (envVars[varName]) {
      // Mask sensitive values
      const val = envVars[varName];
      const masked = val.length > 8 ? val.slice(0, 4) + '****' + val.slice(-4) : '****';
      console.log(`✅ ${varName}: Found (${masked})`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log('\nPlease add these variables to your .env.local file before deploying.');
    console.log('See .env.example for reference.');
    return;
  }

  console.log('\n📋 Optional Environment Variables:');
  console.log('='.repeat(50));
  for (const varName of optionalEnvVars) {
    console.log(
      `${envVars[varName] ? '✅' : '⬜'} ${varName}: ${envVars[varName] ? 'Found' : 'Not set (optional)'}`
    );
  }

  console.log('\n🎯 All required environment variables found!');

  // Step 1: Login ke Vercel (jika belum)
  console.log('\n📦 Starting Deployment Process:');
  console.log('='.repeat(50));

  console.log('\n1️⃣ Checking Vercel authentication...');
  try {
    execSync('vercel whoami', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Already logged in to Vercel');
  } catch {
    console.log('🔐 Please login to Vercel first:');
    console.log('Run: vercel login');
    return;
  }

  // Step 2: Sync env vars ke Vercel (lebih aman dari -e flags)
  console.log('\n2️⃣ Syncing environment variables to Vercel...');
  console.log('   💡 Tip: Use "vercel env pull" untuk sync, atau set manual di dashboard.');
  console.log(
    '   ⚠️  Pastikan semua env vars sudah di-set di Vercel dashboard (Project Settings > Environment Variables)'
  );

  // Step 3: Deploy
  console.log('\n3️⃣ Deploying to Vercel...');
  const deployCommand = 'vercel --prod';

  console.log('\n📝 Deployment command: vercel --prod');
  const deploySuccess = runCommand(deployCommand, 'Vercel deployment');

  if (deploySuccess) {
    console.log('\n🎉 Deployment Successful!');
    console.log('\n📋 Architecture: Cloudflare D1 + R2');
    console.log('   • Database: Cloudflare D1 (relational, SQLite-compatible)');
    console.log('   • Media: Cloudflare R2 (S3-compatible object storage)');
    console.log('   • Auth: JWT + CSRF tokens (stored in D1)');
    console.log('   • Rate Limiting: D1-backed persistent rate limiter');

    console.log('\n🔗 Post-deployment checklist:');
    console.log('   1. Verify admin login works at /admin');
    console.log('   2. Check D1 connectivity via admin status popout');
    console.log('   3. Verify R2 media loading (wallpapers, project images)');
    console.log('   4. Test chat system (visitor message → Telegram notification)');
    console.log('   5. Verify cron watchdog is running (check admin status)');
  } else {
    console.log('\n❌ Deployment failed. Please check the error messages above.');
    console.log('\n🛠️  Troubleshooting:');
    console.log('   1. Ensure all env vars are set in Vercel dashboard');
    console.log('   2. Check Vercel account permissions');
    console.log('   3. Verify Cloudflare D1/R2 credentials are valid');
    console.log('   4. Run: node scripts/cloudflare/test-env.ts');
  }
}

main().catch(console.error);
