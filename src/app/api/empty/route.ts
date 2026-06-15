import { NextResponse } from 'next/server';

/**
 * Empty response endpoint - used to swallow HMR polling requests.
 *
 * Runs on the Edge Runtime: cold-start ~10ms vs ~300-500ms on Node.
 * No Node-only deps used here, so Edge is safe.
 */
export const runtime = 'edge';

const noContent = () => new NextResponse(null, { status: 204 });

export async function GET() {
  return noContent();
}
export async function POST() {
  return noContent();
}
export async function HEAD() {
  return noContent();
}
