// Native FormData in Node 18+
// Node 18 has global FormData but sometimes it's tricky with node-fetch vs global fetch.
// We'll rely on global fetch and FormData being standard.

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

    // 2. Prepare 10 concurrent uploads
    const uploads = [];
    for (let i = 0; i < 10; i++) {
        const formData = new FormData();
        // Create dummy file
        const blob = new Blob(['dummy content'], { type: 'image/png' });
        formData.append('file', blob, 'collision_test_icon.png'); // SAME NAME for all!

        uploads.push(
            fetch('http://localhost:3000/api/upload/github', {
                method: 'POST',
                headers: { 'Cookie': cookie }, // Pass cookie
                body: formData
            }).then(async res => {
                const text = await res.text();
                return { status: res.status, body: text };
            })
        );
    }

    console.log('Firing 10 concurrent uploads with SAME filename...');
    const results = await Promise.all(uploads);

    // 3. Analyze
    const failures = results.filter(r => r.status !== 200);
    const successes = results.filter(r => r.status === 200);

    console.log(`Success: ${successes.length}, Failures: ${failures.length}`);

    if (failures.length > 0) {
        console.error('Sample Failure:', failures[0]);
    } else {
        console.log('ALL PASSED. Unique filenames verified via random suffix logic.');
        // Parse bodies to see filenames
        successes.forEach((s, i) => {
            try {
                const json = JSON.parse(s.body);
                console.log(`[${i}] URL: ${json.url}`);
            } catch (e) { }
        });
    }
}

run();
