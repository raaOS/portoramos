const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const apiKey = 'AIzaSyAujS66RvZMoOWVSA8RpXBs5Xo2LzRA1BE';
const content = `GEMINI_API_KEY=${apiKey}\n`;

fs.writeFileSync(envPath, content, 'utf8');
console.log('Fixed .env.local with API Key');
