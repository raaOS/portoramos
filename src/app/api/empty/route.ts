import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Empty response endpoint - used to swallow HMR polling requests
 * Returns 204 No Content to suppress 404 errors in dev logs
 */
export async function GET() {
  return new NextResponse(null, { status: 204 });
}

export async function POST() {
  return new NextResponse(null, { status: 204 });
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 });
}
