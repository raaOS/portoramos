/**
 * SAFE SYNC SCRIPT
 * 
 * This script downloads the latest JSON data from GitHub (Production)
 * and overwrites the local data files.
 * 
 * It bypasses Git completely to avoid merge conflicts.
 * Usage: npx tsx scripts/sync-content.ts
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const writeFile = promisify(fs.writeFile);

// Config
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = 'main'; // Target branch to pull from
const TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

// Files to Sync (Only content files, safe to overwrite)
const FILES_TO_SYNC = [
    'src/data/about.json',
    'src/data/projects.json',
    'src/data/experience.json',
    'src/data/hardSkills.json',
    'src/data/testimonial.json',
    'src/data/running-text.json',
    'src/data/gallery-featured.json',
    // Add other critical data files here
];

async function fetchFile(filePath: string) {
    if (!OWNER || !REPO) {
        throw new Error('Missing GITHUB_OWNER or GITHUB_REPO in .env');
    }

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-Sync-Script'
    };

    if (TOKEN) {
        headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    console.log(`Downloading: ${filePath}...`);

    // Use fetch API (Node 18+)
    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 404) {
            console.warn(`⚠️ File not found on GitHub: ${filePath} (Skipping)`);
            return null;
        }
        throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Decode Content (GitHub API returns base64)
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
}

async function main() {
    console.log('🔄 STARTING CONTENT SYNC (GitHub -> Local)...');
    console.log('-------------------------------------------');

    let successCount = 0;
    let failCount = 0;

    for (const filePath of FILES_TO_SYNC) {
        try {
            const content = await fetchFile(filePath);

            if (content) {
                // Determine local path
                const localPath = path.join(process.cwd(), filePath);

                // Ensure directory exists
                const dir = path.dirname(localPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Verify it's valid JSON before writing (Safety Check)
                try {
                    JSON.parse(content);
                } catch (e) {
                    console.error(`❌ Received invalid JSON for ${filePath}. Aborting write.`);
                    failCount++;
                    continue;
                }

                // Write File
                await writeFile(localPath, content, 'utf-8');
                console.log(`✅ Updated: ${filePath}`);
                successCount++;
            }
        } catch (error) {
            console.error(`❌ Error syncing ${filePath}:`, error);
            failCount++;
        }
    }

    console.log('-------------------------------------------');
    console.log(`🏁 SYNC COMPLETE: ${successCount} updated, ${failCount} failed.`);
    console.log('   You can now edit content safely!');
}

main().catch(console.error);
