import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/data/analytics-logs.json');

// Helper to ensure file exists
function ensureFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ logs: [] }, null, 2));
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, details } = body;

        ensureFile();

        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);

        const newLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            event, // e.g., "CV_DOWNLOAD", "PROJECT_VIEW"
            details, // e.g., { location: "Jakarta", device: "Mobile" } - currently simulated as client doesn't send sensitive IP data directly
            userAgent: request.headers.get('user-agent') || 'Unknown'
        };

        // Keep only last 100 logs to prevent file bloat
        const updatedLogs = [newLog, ...data.logs].slice(0, 100);

        fs.writeFileSync(DATA_FILE, JSON.stringify({ logs: updatedLogs }, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to log event' }, { status: 500 });
    }
}

export async function GET() {
    try {
        ensureFile();
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ logs: [] });
    }
}
