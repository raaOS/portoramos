#!/usr/bin/env node

/**
 * Admin Password Hash Utility
 * Generate and verify scrypt hashes for admin authentication
 */

const crypto = require('crypto');

/**
 * Generate a scrypt hash for a password
 * @param {string} password
 * @param {string} salt
 * @returns {string} 64-byte hex encoded hash (128 chars)
 */
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

/**
 * Generate a secure random salt
 * @param {number} length
 * @returns {string} Hex encoded salt
 */
function generateSecureSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify if a password matches a hash
 * @param {string} password
 * @param {string} salt
 * @param {string} hash
 * @returns {boolean}
 */
function verifyAdminHash(password, salt, hash) {
  try {
    const generated = generateAdminHash(password, salt);
    return generated === hash;
  } catch (error) {
    return false;
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔐 Admin Password Hash Utility\n');

  if (command === 'generate') {
    const password = args[1];
    const customSalt = args[2];

    if (!password) {
      console.log('Usage: node scripts/security/admin-hash.js generate <password> [optional-salt]');
      return;
    }

    const salt = customSalt || generateSecureSalt();
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
  } else if (command === 'verify') {
    const password = args[1];
    const salt = args[2];
    const hash = args[3];

    if (!password || !salt || !hash) {
      console.log('Usage: node scripts/security/admin-hash.js verify <password> <salt> <hash>');
      return;
    }

    const isValid = verifyAdminHash(password, salt, hash);
    if (isValid) {
      console.log('✅ HASH MATCHES! Authentication will succeed.');
    } else {
      console.log('❌ HASH MISMATCH! Authentication will fail.');
    }
  } else {
    console.log('Available commands:');
    console.log('  generate <password> [salt] - Generate a new scrypt hash');
    console.log('  verify <password> <salt> <hash> - Verify an existing password against a hash');
    console.log('\nExample:');
    console.log('  node scripts/security/admin-hash.js generate "MySecretPassword"');
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateAdminHash, generateSecureSalt, verifyAdminHash };
