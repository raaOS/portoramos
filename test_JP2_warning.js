const fs = require('fs');
const path = require('path');

async function run() {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Urgent2025!' })
    });

    if (!loginRes.ok) return console.error('Login failed');
    const cookie = loginRes.headers.get('set-cookie');

    // Launchpad.icns is the JP2 one
    const filename = 'icnsFile_9a9794114b8e46d4e5061a0ca9f119c0_Launchpad.icns';
    const filePath = path.join(process.cwd(), 'public/assets/test icon incs', filename);

    if (!fs.existsSync(filePath)) return console.error('File not found');

    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: 'image/icns' });
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('folder', 'assets/icons-library-test');

    console.log(`Uploading ${filename}...`);
    const res = await fetch('http://localhost:3000/api/upload/github', {
        method: 'POST',
        headers: { 'Cookie': cookie },
        body: formData
    });

    const json = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(json, null, 2));

    if (json.warning) {
        console.log('SUCCESS: Warning received!');
    } else {
        console.error('FAIL: No warning received.');
    }
}

run();
