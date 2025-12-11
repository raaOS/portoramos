const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/VERCEL_API_TOKEN=([^\r\n]+)/);
const repoMatch = envContent.match(/GITHUB_REPO=([^\r\n]+)/);

const VERCEL_API_TOKEN = tokenMatch ? tokenMatch[1] : null;
const GITHUB_REPO = repoMatch ? repoMatch[1] : 'portoramos';

if (!VERCEL_API_TOKEN) {
    console.error('No VERCEL_API_TOKEN found');
    process.exit(1);
}

function request(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: { message: 'Invalid JSON', raw: data.substring(0, 100) } });
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Fetching Projects...');
    const projectsData = await request('https://api.vercel.com/v9/projects');

    let project = projectsData.projects.find(p =>
        p.link?.type === 'github' &&
        (p.link?.repo === GITHUB_REPO || p.name === GITHUB_REPO || p.link?.repo?.includes(GITHUB_REPO))
    );

    if (!project) project = projectsData.projects[0];
    if (!project) return console.error('Project not found');

    console.log('Project ID:', project.id);

    const endpoints = [
        // Standard documented (maybe scope issue)
        `https://api.vercel.com/v1/projects/${project.id}/analytics/summary`,
        `https://api.vercel.com/v1/projects/${project.id}/speed-insights/stats`,
        // Web Analytics (sometimes mixed)
        `https://api.vercel.com/v1/web-analytics/stats?projectId=${project.id}&from=24h`,
        // Internal/Undocumented attempts
        `https://vercel.com/api/speed-insights/v1/vitals?projectId=${project.id}`,
    ];

    for (const url of endpoints) {
        console.log(`Trying ${url}...`);
        try {
            const data = await request(url);
            if (data.error) {
                console.log(`Failed: ${data.error.message}, Code: ${data.error.code}`);
            } else {
                console.log('SUCCESS!');
                console.log(JSON.stringify(data, null, 2));
                return;
            }
        } catch (e) {
            console.log('Error fetching:', e.message);
        }
    }
    console.log('All probes failed.');
}

main();
