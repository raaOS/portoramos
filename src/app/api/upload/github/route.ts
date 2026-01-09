import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

/**
 * GitHub Direct Upload API
 * Uploads files directly to GitHub Repository via API.
 * Used for Mobile/Vercel environments where local filesystem is ephemeral.
 */

// Config
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_OWNER;
const REPO_NAME = process.env.GITHUB_REPO;
const BRANCH = 'main'; // Adjust if using 'master'

export async function POST(req: NextRequest) {
    if (!checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        return NextResponse.json({ error: 'GitHub Configuration Missing (Token/Owner/Repo)' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Prepare File Data
        const buffer = Buffer.from(await file.arrayBuffer());
        const contentBase64 = buffer.toString('base64');

        const { searchParams } = new URL(req.url);
        const customFilename = searchParams.get('filename');
        const folderParam = searchParams.get('folder');

        const ext = file.name.split('.').pop() || '';

        let finalFilename: string;
        let uploadFolder: string;

        if (customFilename) {
            // Smart Upload: Use slug and target projects folder directly (Skip temp/move/rename dance)
            // This solves "Vercel can't rename files" issue.
            finalFilename = `${customFilename}.${ext}`;
            uploadFolder = 'public/assets/projects';
        } else {
            // Standard Upload
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
            finalFilename = `${Date.now()}-${cleanName}`;
            uploadFolder = folderParam === 'temp' ? 'public/temp' : 'public/assets/media';
        }

        const path = `${uploadFolder}/${finalFilename}`;

        // 2. Upload to GitHub
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Portfolio-Uploader' // GitHub requires User-Agent
            },
            body: JSON.stringify({
                message: `Upload ${filename} via Admin Panel`,
                content: contentBase64,
                branch: BRANCH
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub Upload Failed: ${errorText}`);
        }

        const data = await response.json();

        // 3. Construct Public URL
        // We use the Raw URL for immediate availability (avoiding CDN cache delay)
        // Format: /assets/media/filename (Logic: Next.js Image wrapper should handle this if we use local path logic, 
        // BUT for Vercel deployment we might need absolute URL if the file isn't in the build yet)

        // PROBLEM: If we return "/assets/media/...", Next.js will look in its CURRENT build folder. The file IS NOT THERE yet.
        // It's only on GitHub. Vercel needs to rebuild to fetch it.
        // SOLUTION: Return the Absolute GitHub Raw URL.
        const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`;

        // ALTERNATIVE: jsDelivr (Better for caching, but maybe slight delay)
        // const cdnUrl = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${path}`;

        // Let's stick to a format that our app handles.
        // Since our app expects "/assets/media/...", using an absolute URL might break some internal logic 
        // if we have components strictly expecting relative paths.
        // BUT `next/image` handles absolute URLs fine if hostname is allowed.

        return NextResponse.json({
            url: rawUrl,
            publicPath: `/${path}`, // Helpful for storing in DB if we want relative
            githubPath: data.content.path
        });

    } catch (error: any) {
        console.error('GitHub Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
