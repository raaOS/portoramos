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

    // Check file system access
    try {
      const fs = await import('fs').then((m) => m.promises);
      const path = await import('path');
      const testPath = path.join(process.cwd(), 'public');
      await fs.access(testPath);
      checks.filesystem = 'accessible';
    } catch {
      checks.filesystem = 'inaccessible';
      checks.status = 'degraded';
    }

    // Check configured data backend connection.
    try {
      const { db, getDatabaseBackend } = await import('@/lib/database');

      // Perform an actual lightweight read operation with a timeout
      // This guarantees that the network connection is alive and credentials are valid
      const dbStart = Date.now();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      const readPromise = db.ref('_healthCheck').once('value');

      await Promise.race([readPromise, timeoutPromise]);

      checks.database = 'connected';
      checks.databaseBackend = getDatabaseBackend();
      checks.databaseLatencyMs = Date.now() - dbStart;
    } catch (error) {
      console.error('Database health check failed:', error);
      checks.database = 'disconnected';
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
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
