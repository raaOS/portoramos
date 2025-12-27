import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';

export async function POST(request: NextRequest) {
    try {
        console.log('[BulkUpdate] Started');
        if (!checkAdminAuth(request)) {
            console.warn('[BulkUpdate] Unauthorized');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, ids } = body;
        console.log('[BulkUpdate] Request:', { action, idsCount: ids?.length, ids });

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No project IDs provided' }, { status: 400 });
        }

        let success = false;

        if (action === 'delete') {
            success = await projectService.bulkUpdateProjects({ ids, delete: true });
        } else if (action === 'publish' || action === 'draft') {
            success = await projectService.bulkUpdateProjects({ ids, status: action === 'publish' ? 'published' : 'draft' });
        } else {
            console.warn('[BulkUpdate] Invalid action:', action);
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        console.log('[BulkUpdate] Result:', success);

        if (!success) {
            return NextResponse.json({ error: 'Failed to perform bulk update' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Bulk ${action} successful` });

    } catch (error) {
        console.error('[BulkUpdate] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
