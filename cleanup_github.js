const https = require('https');
require('dotenv').config({ path: '.env.local' });

const TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const PATH = 'public/assets/icons-library';

if (!TOKEN || !OWNER || !REPO) process.exit(1);

const headers = {
    'User-Agent': 'Cleanup-Script',
    'Authorization': `token ${TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
};

async function fetchFiles() {
    return new Promise((resolve) => {
        https.get(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, { headers }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });
}

async function deleteFile(path, sha) {
    return new Promise((resolve) => {
        const options = {
            method: 'DELETE',
            headers,
        };
        const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, options, res => {
            resolve(res.statusCode === 200 || res.statusCode === 204);
        });
        req.write(JSON.stringify({
            message: 'Cleanup duplicate',
            sha
        }));
        req.end();
    });
}

async function run() {
    const files = await fetchFiles();
    if (!Array.isArray(files)) return console.error('Failed to list files');

    console.log(`Checking ${files.length} files...`);

    const map = {};
    const toDelete = [];

    files.forEach(f => {
        if (f.name.includes('_temp')) {
            console.log('Found temp junk:', f.name);
            toDelete.push(f);
            return;
        }

        const match = f.name.match(/^\d+-icnsfile-([a-f0-9]+)-(.+)$/);
        if (match) {
            const key = match[1] + '-' + match[2]; // Hash + Name
            if (!map[key]) map[key] = [];
            map[key].push(f);
        } else {
            console.log('Skipping standard/unknown file:', f.name);
        }
    });

    Object.values(map).forEach(group => {
        if (group.length > 1) {
            // Sort by name (timestamp is prefix) descending -> Keep NEWEST
            group.sort((a, b) => b.name.localeCompare(a.name));

            // Keep [0], delete rest
            for (let i = 1; i < group.length; i++) {
                toDelete.push(group[i]);
            }
        }
    });

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    // Process in chunks to avoid rate limiting
    for (let i = 0; i < toDelete.length; i++) {
        const f = toDelete[i];
        console.log(`[${i + 1}/${toDelete.length}] Deleting ${f.name}...`);
        await deleteFile(f.path, f.sha);
        await new Promise(r => setTimeout(r, 300)); // Throttle
    }

    console.log('Done.');
}

run();
