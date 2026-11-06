import { NextResponse } from 'next/server';
import { issueVisitorSession } from '@/lib/chatSession';
import { enforceRequestRateLimit } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

/**
 * Issues a server-signed visitor chat session.
 * Client cannot mint signatures for arbitrary visitorIds (IDOR fix).
 */
export async function POST(request: Request) {
  try {
    const rateLimit = await enforceRequestRateLimit(request, 'chat_session', 20, 60_000, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 60) } }
      );
    }

    const session = issueVisitorSession();
    return NextResponse.json({ success: true, ...session });
  } catch (error) {
    console.error('[Chat Session] Failed to issue session:', error);
    return NextResponse.json({ error: 'Failed to issue chat session' }, { status: 500 });
  }
}
