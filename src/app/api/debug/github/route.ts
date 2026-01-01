
import { NextResponse } from 'next/server';
import { githubService } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET() {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

    const envCheck = {
        GITHUB_OWNER: owner ? 'Set' : 'Missing',
        GITHUB_OWNER_VAL: owner, // Safe to show owner
        GITHUB_REPO: repo ? 'Set' : 'Missing',
        GITHUB_REPO_VAL: repo, // Safe to show repo
        GITHUB_TOKEN_EXISTS: !!token,
        GITHUB_TOKEN_LENGTH: token ? token.length : 0,
        NODE_ENV: process.env.NODE_ENV
    };

    let connectionResult: any = { status: 'Not Attempted' };

    try {
        // Attempt raw fetch to see exactly what happens
        if (!owner || !repo) throw new Error('Owner or Repo env vars missing');

        const path = 'src/data/projects.json';
        const result = await githubService.getFile(true);

        connectionResult = {
            status: 'Success',
            sha: result.sha,
            projectCount: result.content.projects?.length || 0,
            lastUpdated: result.content.lastUpdated
        };
    } catch (error: any) {
        connectionResult = {
            status: 'Failed',
            message: error.message,
            stack: error.stack
        };
    }

    return NextResponse.json({
        env: envCheck,
        connection: connectionResult,
        timestamp: new Date().toISOString()
    }, { status: 200 });
}
