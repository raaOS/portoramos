#!/usr/bin/env node

const crypto = require('crypto');

// Function to generate random salt
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

// Function to hash password with salt
function hashPassword(password, salt) {
    return crypto
        .createHash('sha256')
        .update(password + salt)
        .digest('hex');
}

// Get password from command line argument
const password = "Urgent2025!";
const salt = generateSalt();
const hash = hashPassword(password, salt);

console.log('\n=== Admin Password Generator ===\n');
console.log(`Password yang digunakan: ${password}`);
console.log('\nCopy nilai-nilai berikut ke environment variables Vercel:\n');
console.log(`PASSWORD_SALT=${salt}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('Simpan password Anda dengan aman!\n');
