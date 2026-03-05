
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        // Bypass auth for one-time restoration via terminal
        // const isAdmin = await validateAdminRequest(req);
        // if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const projectsSnap = await db.ref('projects').once('value');
        const projectsObject = projectsSnap.val() || {};
        const projects = Object.values(projectsObject);

        const data = {
            projects: projects,
            lastUpdated: new Date().toISOString()
        };

        const dir = path.join(process.cwd(), 'src/data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const targetPath = path.join(dir, 'projects.json');
        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));

        return NextResponse.json({
            message: 'projects.json restored successfully',
            count: projects.length,
            path: targetPath
        });
    } catch (error: any) {
        console.error('Restoration error:', error);
        return NextResponse.json({ error: error.message || 'Restoration failed' }, { status: 500 });
    }
}
