const fs = require('fs');
const path = require('path');

async function run() {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Urgent2025!' })
    });

    if (!loginRes.ok) {
        console.error('Login failed');
        return;
    }
    const cookie = loginRes.headers.get('set-cookie');

    // 2. Get Files
    const sourceDir = path.join(process.cwd(), 'public/assets/test icon incs');
    if (!fs.existsSync(sourceDir)) {
        console.error('Source dir not found:', sourceDir);
        return;
    }
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.icns'));
    console.log(`Found ${files.length} ICNS files. Preparing concurrent upload...`);

    // 3. Fire Uploads
    const startTime = Date.now();
    const uploads = files.map((filename, index) => {
        const filePath = path.join(sourceDir, filename);
        const buffer = fs.readFileSync(filePath);
        // Node 18+ Blob
        const blob = new Blob([buffer], { type: 'image/icns' });

        const formData = new FormData();
        formData.append('file', blob, filename);
        // Target specific folder
        formData.append('folder', 'assets/icons-library');

        return fetch('http://localhost:3000/api/upload/github?folder=assets/icons-library', {
            method: 'POST',
            headers: { 'Cookie': cookie },
            body: formData
        }).then(async res => {
            const text = await res.text();
            let status = res.status;
            let url = '';
            try {
                const json = JSON.parse(text);
                if (json.url) url = json.url;
            } catch (e) { }
            return { filename, status, url, error: res.ok ? null : text };
        });
    });

    const results = await Promise.all(uploads);
    const duration = (Date.now() - startTime) / 1000;

    // 4. Report
    console.log(`\n--- Test Failed: ${results.filter(r => r.status !== 200).length} ---`);
    console.log(`--- Test Success: ${results.filter(r => r.status === 200).length} ---`);
    console.log(`--- Duration: ${duration.toFixed(2)}s ---\n`);

    results.forEach(r => {
        if (r.status === 200) {
            console.log(`[OK] ${r.filename} -> ${r.url}`);
        } else {
            console.error(`[FAIL] ${r.filename} (${r.status}): ${r.error}`);
        }
    });
}

run();
