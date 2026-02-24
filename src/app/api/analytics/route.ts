import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';

// Firebase path for analytics logs
const ANALYTICS_PATH = 'analytics/logs';
const MAX_LOGS = 100;

interface AnalyticsLog {
    id: string;
    timestamp: string;
    event: string;
    details: Record<string, unknown>;
    userAgent: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event, details } = body as { event: string; details: Record<string, unknown> };

        if (!event) {
            return NextResponse.json({ success: false, error: 'Missing event field' }, { status: 400 });
        }

        const newLog: AnalyticsLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            event,
            details: details || {},
            userAgent: request.headers.get('user-agent') || 'Unknown'
        };

        // Write to Firebase (async, works on Vercel)
        const logsSnap = await db.ref(ANALYTICS_PATH).once('value');
        const existing: AnalyticsLog[] = logsSnap.exists() ? Object.values(logsSnap.val()) : [];

        // Keep only last MAX_LOGS entries
        const updated = [newLog, ...existing].slice(0, MAX_LOGS);

        // Rewrite as object keyed by id
        const updatedMap: Record<string, AnalyticsLog> = {};
        updated.forEach(log => { updatedMap[log.id] = log; });
        await db.ref(ANALYTICS_PATH).set(updatedMap);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to log event' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // Only admins can read analytics
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const logsSnap = await db.ref(ANALYTICS_PATH).once('value');
        const logs: AnalyticsLog[] = logsSnap.exists()
            ? (Object.values(logsSnap.val()) as AnalyticsLog[]).sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            : [];

        return NextResponse.json({ logs });
    } catch (error) {
        return NextResponse.json({ logs: [] });
    }
}
