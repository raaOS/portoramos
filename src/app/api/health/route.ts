import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used for monitoring uptime and basic system status
 */
export async function GET() {
    try {
        const checks: Record<string, unknown> = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'unknown',
            version: '1.0.0',
        };

        // Check GitHub API connectivity
        try {
            const { githubService } = await import('@/lib/github');
            await githubService.getFileContent('README.md', true);
            checks.github = 'connected';
        } catch {
            checks.github = 'disconnected';
            checks.status = 'degraded';
        }

        // Check file system access
        try {
            const fs = await import('fs').then(m => m.promises);
            const path = await import('path');
            const testPath = path.join(process.cwd(), 'public');
            await fs.access(testPath);
            checks.filesystem = 'accessible';
        } catch {
            checks.filesystem = 'inaccessible';
            checks.status = 'degraded';
        }

        // Memory usage
        const memUsage = process.memoryUsage();
        checks.memory = {
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        };

        const statusCode = checks.status === 'ok' ? 200 : 503;
        return NextResponse.json(checks, { status: statusCode });
    } catch {
        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        }, { status: 500 });
    }
}
