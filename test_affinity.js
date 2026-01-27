async function check() {
    const urls = [
        'https://cdn.simpleicons.org/affinitydesigner',
        'https://cdn.simpleicons.org/affinity', // Check if this exists
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/affinitydesigner/affinitydesigner-original.svg',
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg'
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url);
            console.log(`[${res.status}] ${url} (${res.headers.get('content-type')})`);
        } catch (e) {
            console.log(`[ERR] ${url}: ${e.message}`);
        }
    }
}
check();
