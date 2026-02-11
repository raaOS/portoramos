const crypto = require('crypto');

function hashPasswordScrypt(password, salt) {
    const key = crypto.scryptSync(password, salt, 64);
    return key.toString('hex');
}

const password = "Urgent2025!";
const salt = "0f1978905a2fc3cf2126ff9d9ce87076";
const expected = "99c75b59b090beea7adccdd1d76dce20cfaa0695304c4077df1f4fab2c103889083a0255eeb535c4fd3d2d968c6cc626242f0d7cb47f25a1ff2b32db19bfd29";

const hashed = hashPasswordScrypt(password, salt);
console.log("Calculated:", hashed);
console.log("Expected:  ", expected);
console.log("Matches:", hashed === expected);
if (hashed !== expected) {
    console.log("Length Calc:", hashed.length);
    console.log("Length Exp: ", expected.length);
}
