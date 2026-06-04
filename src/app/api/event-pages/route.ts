import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateAdminRequest } from '@/lib/auth';
import { eventPageService } from '@/lib/services/eventPageService';
import {
  badRequest,
  created,
  notFound,
  serverError,
  success,
  unauthorized,
} from '@/lib/api-response';
import type { EventPageInput } from '@/types/event-page';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';
    const folderId = searchParams.get('folderId');

    if (includeAll) {
      if (!(await validateAdminRequest(request, { checkCsrf: false }))) {
        return unauthorized();
      }

      const pages = await eventPageService.getAllPages();
      return success({ pages });
    }

    if (!folderId) {
      return badRequest('folderId is required');
    }

    const isAdminPreview =
      searchParams.get('preview') === 'true' &&
      (await validateAdminRequest(request, { checkCsrf: false }));
    const page = await eventPageService.getResolvedPageByFolderId(folderId, isAdminPreview);

    return success({ page });
  } catch (error) {
    console.error('[API /event-pages GET] Error:', error);
    return serverError('Failed to load event page');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized('Invalid or missing CSRF token');
    }

    const body = (await request.json()) as EventPageInput;
    const { page, isNew } = await eventPageService.upsertPage(body);

    revalidatePath('/', 'layout');
    return isNew
      ? created(page, 'Event page created successfully')
      : success(page, 'Event page updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message === 'Title is required' ||
      message === 'Folder is required' ||
      message === 'Description is required' ||
      message.includes('already has')
    ) {
      return badRequest(message);
    }

    console.error('[API /event-pages POST] Error:', error);
    return serverError('Failed to save event page');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized('Invalid or missing CSRF token');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return badRequest('ID is required');

    await eventPageService.deletePage(id);
    revalidatePath('/', 'layout');
    return success(null, 'Event page deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Event page not found') return notFound(message);

    console.error('[API /event-pages DELETE] Error:', error);
    return serverError('Failed to delete event page');
  }
}
