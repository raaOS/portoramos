#!/usr/bin/env node

/**
 * Admin Password Hash Generator
 * Generate proper scrypt hash for admin password
 */

const crypto = require('crypto');

function generateAdminHash(password, salt) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  if (!salt || salt.length < 8) {
    throw new Error('Salt must be at least 8 characters');
  }

  const key = crypto.scryptSync(password, salt, 64);
  return key.toString('hex');
}

function generateSecureSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// Main function
function main() {
  console.log('🔐 Admin Password Hash Generator\n');
  
  // Check if password provided as argument
  const password = process.argv[2];
  const customSalt = process.argv[3];
  
  if (!password) {
    console.log('Usage: node scripts/generate-admin-hash.js "your-password" [optional-salt]');
    console.log('\nExample:');
    console.log('  node scripts/generate-admin-hash.js "Urgent2025!"');
    console.log('  node scripts/generate-admin-hash.js "Urgent2025!" "my-custom-salt"');
    console.log('\nIf no salt provided, a random salt will be generated.');
    return;
  }
  
  try {
    // Generate or use provided salt
    const salt = customSalt || generateSecureSalt();
    
    // Generate hash
    const hash = generateAdminHash(password, salt);
    
    console.log('✅ Hash generated successfully!\n');
    console.log('Password:', password);
    console.log('Salt:', salt);
    console.log('Hash:', hash);
    console.log('\n📋 Add these to your .env.local:');
    console.log('─'.repeat(50));
    console.log(`ADMIN_PASSWORD_SCRYPT="${hash}"`);
    console.log(`PASSWORD_SALT="${salt}"`);
    console.log('─'.repeat(50));
    console.log('\n💡 Security Tips:');
    console.log('- Use a strong, unique password');
    console.log('- Keep your salt secure');
    console.log('- Rotate passwords periodically');
    console.log('- Use different salts for different environments');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateAdminHash, generateSecureSalt };