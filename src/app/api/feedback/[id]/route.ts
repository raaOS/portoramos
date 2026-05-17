import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { validateAdminRequest } from '@/lib/auth';
import { feedbackModerationSchema } from '@/lib/validations';
import { success, unauthorized, notFound, validationError, serverError, badRequest } from '@/lib/api-response';

/**
 * PATCH /api/feedback/[id]
 * Admin-only â€” update status + isPublic untuk moderation.
 *
 * Body: { status: 'pending' | 'approved' | 'hidden' | 'deleted', isPublic?: boolean }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await validateAdminRequest(request))) {
            return unauthorized('Admin authentication required');
        }

        const { id } = await params;
        if (!id) return badRequest('Missing feedback id');

        const rawBody = await request.json().catch(() => null);
        if (!rawBody) return badRequest('Invalid JSON body');

        const parsed = feedbackModerationSchema.safeParse(rawBody);
        if (!parsed.success) return validationError(parsed.error);

        const ref = db.ref(`feedback/${id}`);
        const snap = await ref.once('value');
        if (!snap.exists()) return notFound('Feedback not found');

        // Auto-set isPublic: default approved â†’ public, hidden/deleted â†’ not public
        const { status, isPublic } = parsed.data;
        const resolvedIsPublic =
            typeof isPublic === 'boolean'
                ? isPublic
                : status === 'approved';

        await ref.update({
            status,
            isPublic: resolvedIsPublic,
            moderatedAt: new Date().toISOString(),
        });

        return success({ id, status, isPublic: resolvedIsPublic }, 'Feedback updated');
    } catch (error) {
        console.error('[API /feedback/[id] PATCH] Error:', error instanceof Error ? error.message : error);
        return serverError('Failed to update feedback');
    }
}

/**
 * DELETE /api/feedback/[id]
 * Admin-only â€” hard delete feedback entry.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await validateAdminRequest(request))) {
            return unauthorized('Admin authentication required');
        }

        const { id } = await params;
        if (!id) return badRequest('Missing feedback id');

        const ref = db.ref(`feedback/${id}`);
        const snap = await ref.once('value');
        if (!snap.exists()) return notFound('Feedback not found');

        await ref.remove();
        return success({ id }, 'Feedback deleted');
    } catch (error) {
        console.error('[API /feedback/[id] DELETE] Error:', error instanceof Error ? error.message : error);
        return serverError('Failed to delete feedback');
    }
}

