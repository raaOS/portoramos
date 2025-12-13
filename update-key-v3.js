const fs = require('fs');
const path = require('path');
const content = [
    'GEMINI_API_KEY=AIzaSyBaH1zhtMpriSGo10weANyr3rzCh5QAekk',
    'ADMIN_PASSWORD=Urgent2025!',
    'JWT_SECRET=super-secret-key-change-this-in-production-2025'
].join('\n');
fs.writeFileSync(path.resolve(process.cwd(), '.env.local'), content, 'utf8');
console.log('Updated .env.local with new API Key');
