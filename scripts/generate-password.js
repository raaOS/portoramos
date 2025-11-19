const crypto = require('crypto');

const password = process.argv[2];
const salt = crypto.randomBytes(16).toString('hex');

const hash = crypto
  .createHash('sha256')
  .update(password + salt)
  .digest('hex');

console.log('PASSWORD_SALT=' + salt);
console.log('ADMIN_PASSWORD_HASH=' + hash);
