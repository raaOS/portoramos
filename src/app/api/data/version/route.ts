import { NextResponse } from 'next/server';
import { db, getDatabaseBackend } from '@/lib/database';

// Edge runtime: endpoint trivial yang cuma baca 1 key dari Cloudflare D1 via REST.
// Cold start lebih cepat dibanding Node lambda dan tidak ada Node-only dependency.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snap = await db.ref('lastUpdated').once('value');
    return NextResponse.json(
      {
        backend: getDatabaseBackend(),
        lastUpdated: snap.val() || null,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[DataVersion] Failed to read lastUpdated:', error);
    return NextResponse.json(
      {
        backend: getDatabaseBackend(),
        lastUpdated: null,
        error: 'Failed to read data version',
      },
      { status: 500 }
    );
  }
}
