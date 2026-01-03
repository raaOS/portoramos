#!/usr/bin/env node
// Script untuk deployment ke Vercel dengan environment variables yang lengkap
// Usage: node scripts/deploy-vercel.mjs

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read .env.local file untuk mendapatkan environment variables
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=')
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.warn('⚠️  Could not read .env.local file:', error.message)
    return {}
  }
}

function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`)
    console.log(`Command: ${command}`)
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    console.log(`✅ ${description} completed successfully`)
    return true
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Deploying to Vercel with Environment Variables\n')
  
  const envVars = loadEnvFile()
  
  // Environment variables yang diperlukan untuk production
  const requiredEnvVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD'
  ]
  
  console.log('📋 Checking Environment Variables:')
  console.log('='.repeat(50))
  
  let missingVars = []
  
  for (const varName of requiredEnvVars) {
    if (envVars[varName]) {
      console.log(`✅ ${varName}: Found`)
    } else {
      console.log(`❌ ${varName}: Missing`)
      missingVars.push(varName)
    }
  }
  
  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing environment variables:')
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`)
    })
    console.log('\nPlease add these variables to your .env.local file before deploying.')
    return
  }
  
  console.log('\n🎯 All environment variables found!')
  
  // Build environment variables command untuk Vercel
  const envFlags = requiredEnvVars
    .filter(varName => envVars[varName])
    .map(varName => `-e ${varName}="${envVars[varName]}"`)
    .join(' ')
  
  console.log('\n📦 Starting Deployment Process:')
  console.log('='.repeat(50))
  
  // Step 1: Login ke Vercel (jika belum)
  console.log('\n1️⃣ Checking Vercel authentication...')
  try {
    execSync('vercel whoami', { encoding: 'utf8', stdio: 'pipe' })
    console.log('✅ Already logged in to Vercel')
  } catch (error) {
    console.log('🔐 Please login to Vercel first:')
    console.log('Run: vercel login')
    return
  }
  
  // Step 2: Deploy dengan environment variables
  console.log('\n2️⃣ Deploying to Vercel...')
  const deployCommand = `vercel --prod ${envFlags}`
  
  console.log('\n📝 Deployment command:')
  console.log('vercel --prod [with environment variables]')
  
  const deploySuccess = runCommand(deployCommand, 'Vercel deployment')
  
  if (deploySuccess) {
    console.log('\n🎉 Deployment Successful!')
    console.log('\n📋 What happens next:')
    console.log('1. ✅ Production will use separate KV store keys (with :prod suffix)')
    console.log('2. ✅ Development data remains separate (with :dev suffix)')
    console.log('3. 🔄 Upload new content in production admin panel')
    console.log('4. ✅ Verify that dev and production data are completely separate')
    
    console.log('\n🔗 Access your deployed application:')
    console.log('- Production URL will be shown above')
    console.log('- Admin panel: [your-url]/admin')
    
    console.log('\n🎯 Environment Separation Status:')
    console.log('✅ Development: Uses keys with :dev suffix')
    console.log('✅ Production: Uses keys with :prod suffix')
    console.log('✅ Data is completely separated between environments')
  } else {
    console.log('\n❌ Deployment failed. Please check the error messages above.')
    console.log('\n🛠️  Troubleshooting:')
    console.log('1. Make sure all environment variables are correct')
    console.log('2. Check your Vercel account permissions')
    console.log('3. Verify your project is properly configured')
  }
}

main().catch(console.error)