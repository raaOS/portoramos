import fs from 'fs';
import path from 'path';

// Manual env parsing to avoid dotenv dependency
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const firstEqual = line.indexOf('=');
            if (firstEqual > 0) {
                const key = line.substring(0, firstEqual).trim();
                let value = line.substring(firstEqual + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn('Failed to load .env.local manually');
}

async function testGithub() {
    console.log('Testing GitHub Connection...');
    console.log('Token exists:', !!process.env.GITHUB_ACCESS_TOKEN);
    console.log('Owner:', process.env.GITHUB_OWNER);
    console.log('Repo:', process.env.GITHUB_REPO);

    try {
        // Dynamic import to ensure env vars are loaded first
        const { githubService } = await import('../src/lib/github');

        const file = await githubService.getFile();
        console.log('✅ Success! Fetched current projects.json');
        console.log('Current SHA:', file.sha);
        console.log('Project Count:', file.content.projects.length);
    } catch (error) {
        console.error('❌ Failed:', error);
    }
}

testGithub();
