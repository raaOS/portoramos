const https = require('https');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Config
const TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const PATH = 'public/assets/icons-library';

if (!TOKEN || !OWNER || !REPO) {
    console.error('Missing env vars:', { TOKEN: !!TOKEN, OWNER, REPO });
    process.exit(1);
}

const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

const options = {
    headers: {
        'User-Agent': 'Verifier-Script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error('GitHub Error:', res.statusCode, data);
            return;
        }
        try {
            const files = JSON.parse(data);
            const count = files.length;
            console.log(`GitHub File Count: ${count}`);

            // Analyze for dups
            const map = {};
            files.forEach(f => {
                // regex: timestamp-icnsfile-hash-name
                const match = f.name.match(/^\d+-icnsfile-([a-f0-9]+)-(.+)$/);
                if (match) {
                    const key = match[1] + '-' + match[2]; // Hash + Name
                    if (!map[key]) map[key] = [];
                    map[key].push(f.name);
                } else {
                    console.log('Non-standard file:', f.name);
                }
            });

            let dupCount = 0;
            Object.keys(map).forEach(key => {
                if (map[key].length > 1) {
                    dupCount++;
                    console.log(`Duplicate found for hash ${key}: ${map[key].length} copies`);
                }
            });

            console.log(`Total Unique Icons: ${Object.keys(map).length}`);
            console.log(`Total Extra Duplicates: ${count - Object.keys(map).length}`);

        } catch (e) {
            console.error('Parse error:', e);
        }
    });
}).on('error', e => console.error(e));
