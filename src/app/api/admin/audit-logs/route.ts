import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = checkAdminAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Ambil maksimal 50 log terakhir
    const snapshot = await db.ref('audit_logs').orderByChild('timestamp').limitToLast(50).once('value');
    const data = snapshot.val();

    if (!data) {
      return NextResponse.json({ logs: [] });
    }

    // Convert Object ke array dan sort descending berdasarkan timestamp
    const logsArray = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ logs: logsArray });
  } catch (error) {
    console.error('[AuditLogs] Error fetching logs:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
