// const fetch = require('node-fetch'); // Native fetch in Node 18+
const fs = require('fs');
const path = require('path');

const filePath = '/assets/test icon dock.icns';
const absPath = path.join(__dirname, 'public', 'assets', 'test icon dock.icns');

if (!fs.existsSync(absPath)) {
    console.error('Test file not found:', absPath);
    process.exit(1);
}

console.log('Found test file. Starting API request...');

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'Urgent2025!' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', loginRes.status);
            return;
        }

        const cookie = loginRes.headers.get('set-cookie');
        console.log('Login successful.');

        // 2. Compress
        console.log('Requesting compression...');
        const response = await fetch('http://localhost:3000/api/admin/compress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify({ filePath })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Success:', data.success);
        console.log('Note:', data.note);
        console.log('New Path:', data.newPath);

        // 3. Verify
        // Wait a small bit for async fs
        await new Promise(r => setTimeout(r, 1000));

        const icnsExists = fs.existsSync(absPath);
        const webpExists = fs.existsSync(absPath.replace('.icns', '.webp'));

        console.log(`CHECK: ICNS=${icnsExists}, WEBP=${webpExists}`);

        if (!icnsExists && webpExists) {
            console.log('PASS: Auto-delete confirmed.');
        } else {
            console.log('FAIL: Cleanup incomplete.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
