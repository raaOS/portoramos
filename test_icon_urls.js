// Native fetch used in Node 18+

async function checkUrl(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log(`[${res.status}] ${url}`);
        return res.ok;
    } catch (e) {
        console.log(`[ERR] ${url}: ${e.message}`);
        return false;
    }
}

async function test() {
    console.log('Testing Affinity Icon URLs...');

    const candidates = [
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/affinitydesigner/affinitydesigner-original.svg',
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/affinity/affinity-original.svg',
        'https://cdn.simpleicons.org/affinitydesigner',
        'https://cdn.simpleicons.org/affinity',
        'https://cdn.simpleicons.org/affinityphoto',
        'https://cdn.simpleicons.org/canva',
    ];

    for (const url of candidates) {
        await checkUrl(url);
    }
}

test();
