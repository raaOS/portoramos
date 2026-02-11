#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Run this to check if all required environment variables are configured
 */

const fs = require('fs');
const path = require('path');

// Simple validation without ES modules
function validateEnvironment() {
  const requiredVars = [
    {
      name: 'JWT_SECRET',
      required: true,
      description: 'Secret key for JWT token generation',
      minLength: 32
    },
    {
      name: 'ADMIN_PASSWORD_SCRYPT',
      required: true,
      description: 'Scrypt hashed admin password'
    },
    {
      name: 'PASSWORD_SALT',
      required: true,
      description: 'Salt for password hashing'
    },
    {
      name: 'UPSTASH_REDIS_REST_URL',
      required: true,
      description: 'Upstash Redis REST URL'
    },
    {
      name: 'UPSTASH_REDIS_REST_TOKEN',
      required: true,
      description: 'Upstash Redis REST token'
    },
    {
      name: 'TELEGRAM_BOT_TOKEN',
      required: false,
      description: 'Telegram bot token for notifications'
    },
    {
      name: 'TELEGRAM_CHAT_ID',
      required: false,
      description: 'Telegram chat ID for notifications'
    }
  ];

  const errors = [];
  const warnings = [];

  requiredVars.forEach(envVar => {
    const value = process.env[envVar.name];
    
    if (envVar.required && !value) {
      errors.push(`❌ Missing: ${envVar.name} - ${envVar.description}`);
    } else if (value && envVar.minLength && value.length < envVar.minLength) {
      warnings.push(`⚠️  ${envVar.name} should be at least ${envVar.minLength} characters`);
    } else if (!envVar.required && !value) {
      warnings.push(`ℹ️  Optional: ${envVar.name} not set - ${envVar.description}`);
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

function generateEnvExample() {
  return `# Portfolio Environment Variables
# Copy this to .env.local and fill in your values

# Required for Authentication
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars"
ADMIN_PASSWORD_SCRYPT="your-scrypt-hashed-password"
PASSWORD_SALT="your-random-salt-string"

# Required for Database (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://your-region-upstash-com.rest"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
UPSTASH_REDIS_KEY="portfolio:projects:v1"

# Optional for Notifications
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
TELEGRAM_CHAT_ID="-1001234567890"

# Optional for AI Features
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
`;
}

// Main execution
console.log('🔍 Portfolio Environment Variables Validator\n');

const { valid, errors, warnings } = validateEnvironment();

if (errors.length > 0) {
  console.log('❌ ERRORS FOUND:');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

if (valid) {
  console.log('✅ All required environment variables are configured!');
  
  if (warnings.length === 0) {
    console.log('🎉 Perfect! Your environment is ready for Tier S deployment.');
  }
} else {
  console.log('❌ Please fix the errors above before proceeding.');
  console.log('\n💡 To generate a template .env file, run:');
  console.log('   node scripts/validate-env.js --example');
}

if (process.argv.includes('--example')) {
  console.log('\n📝 Generated .env.example file content:');
  console.log('─'.repeat(50));
  console.log(generateEnvExample());
  console.log('─'.repeat(50));
  console.log('\n💾 Save this as .env.local in your project root');
}

process.exit(valid ? 0 : 1);