#!/usr/bin/env node

/**
 * Compare Admin Hash - Debug Tool
 */

const crypto = require('crypto');
const fs = require('fs');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const password = 'Urgent2025!';
const salt = '0f1978905a2fc3cf2126ff9d9ce87076';
const currentHash = '99c75b59b090beea7adccdd1d76dce20cfaa0695304c4077df1f4fab2c10388c33a0255eeb535c4fd3d2d968c6cc626242f0d7cb47f25a1ff2b32db19bfd29';

console.log('🔍 Comparing admin hashes...\n');
console.log('Password:', password);
console.log('Salt:', salt);
console.log('Current hash from env:', currentHash);
console.log('');

// Generate new hash
const generatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
console.log('Generated hash:', generatedHash);
console.log('');

// Detailed comparison
console.log('Length comparison:');
console.log('Current:', currentHash.length, 'chars');
console.log('Generated:', generatedHash.length, 'chars');
console.log('');

console.log('First 32 characters:');
console.log('Current:  ', currentHash.substring(0, 32));
console.log('Generated:', generatedHash.substring(0, 32));
console.log('');

console.log('Last 32 characters:');
console.log('Current:  ', currentHash.substring(currentHash.length - 32));
console.log('Generated:', generatedHash.substring(generatedHash.length - 32));
console.log('');

// Find first difference
let firstDiff = -1;
for (let i = 0; i < Math.min(currentHash.length, generatedHash.length); i++) {
  if (currentHash[i] !== generatedHash[i]) {
    firstDiff = i;
    break;
  }
}

if (firstDiff !== -1) {
  console.log('First difference at position:', firstDiff);
  console.log('Current char:  "' + currentHash[firstDiff] + '"');
  console.log('Generated char: "' + generatedHash[firstDiff] + '"');
  console.log('');
  
  // Show context around difference
  const start = Math.max(0, firstDiff - 10);
  const end = Math.min(currentHash.length, firstDiff + 10);
  console.log('Context around difference:');
  console.log('Current:  "' + currentHash.substring(start, end) + '"');
  console.log('Generated:"' + generatedHash.substring(start, end) + '"');
  console.log('          ' + ' '.repeat(firstDiff - start) + '↑');
} else if (currentHash === generatedHash) {
  console.log('✅ HASHES MATCH! Login should work.');
} else {
  console.log('❌ Hashes don\'t match but no difference found (length mismatch?)');
}

console.log('');
console.log('Match result:', currentHash === generatedHash ? '✅ VALID' : '❌ INVALID');