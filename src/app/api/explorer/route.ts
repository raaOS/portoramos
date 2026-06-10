import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateAdminRequest } from '@/lib/auth';
import { explorerService } from '@/lib/services/explorerService';
import { eventPageService } from '@/lib/services/eventPageService';
import {
  badRequest,
  created,
  notFound,
  serverError,
  success,
  unauthorized,
} from '@/lib/api-response';
import type { ExplorerFolder } from '@/types/explorer';

export const dynamic = 'force-dynamic';

// Public OS Explorer lists one folder at a time. The full tree is admin-only.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let parentId = searchParams.get('parentId');
    const includeAll = searchParams.get('all') === 'true';

    if (includeAll) {
      if (!(await validateAdminRequest(request, { checkCsrf: false }))) {
        return unauthorized();
      }
      const nodes = await explorerService.getAllNodes();
      return success({ nodes, path: [] });
    }

    if (!parentId || parentId === 'root' || parentId === 'undefined') {
      parentId = null;
    }

    const nodes = await explorerService.getNodes(parentId);
    let path: ExplorerFolder[] = [];

    if (searchParams.get('path') === 'true' && parentId) {
      path = await explorerService.getPath(parentId);
    }

    return success({ nodes, path });
  } catch (error) {
    console.error('[API /explorer GET] Error:', error);
    return serverError('Failed to load explorer nodes');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized();
    }

    const body = await request.json();
    const { type = 'folder', parentId = null } = body;

    if (type === 'folder') {
      const { name } = body;
      if (!name || typeof name !== 'string') return badRequest('Folder name is required');
      const folder = await explorerService.createFolder(name, parentId);
      revalidatePath('/', 'layout');
      return created(folder, 'Folder created successfully');
    }

    if (type === 'file') {
      const {
        name,
        url,
        previewUrl,
        thumbnailUrl,
        fileType,
        storageKey,
        previewKey,
        thumbnailKey,
        mimeType,
        originalName,
        size,
        metadata,
      } = body;

      if (!name || !url || !fileType) {
        return badRequest('Missing required file information (name, url, or fileType)');
      }

      const file = await explorerService.createFile({
        name: name as string,
        url,
        previewUrl,
        thumbnailUrl,
        storageKey,
        previewKey,
        thumbnailKey,
        mimeType,
        originalName,
        fileType,
        parentId,
        size,
        metadata,
      });
      revalidatePath('/', 'layout');
      return created(file, 'File uploaded and registered successfully');
    }

    return badRequest('Invalid node type');
  } catch (error) {
    console.error('[API /explorer POST] Error:', error);
    return serverError('Failed to create node');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized();
    }

    const body = await request.json();
    const { action, id } = body;
    if (!id || typeof id !== 'string') {
      return badRequest('ID is required');
    }

    if (action === 'rename') {
      const { name } = body;
      if (!name || typeof name !== 'string') {
        return badRequest('Name is required');
      }
      const node = await explorerService.renameNode(id, name);
      revalidatePath('/', 'layout');
      return success(node, 'Node renamed successfully');
    }

    if (action === 'move') {
      const parentId = body.parentId ?? null;
      if (parentId !== null && typeof parentId !== 'string') {
        return badRequest('Target parentId must be a string or null');
      }
      const node = await explorerService.moveNode(id, parentId);
      revalidatePath('/', 'layout');
      return success(node, 'Node moved successfully');
    }

    return badRequest('Invalid action');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Node not found') return notFound(message);
    if (
      message === 'Target folder not found' ||
      message.includes('Cannot move') ||
      message.includes('changed while update')
    ) {
      return badRequest(message);
    }
    console.error('[API /explorer PATCH] Error:', error);
    return serverError('Failed to update node');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return badRequest('ID is required');
    }

    const result = await explorerService.deleteNode(id);

    // Prune event page references in a best-effort fashion.
    // If this fails (e.g. CAS contention), explorer delete still succeeds
    // and orphaned references are safely handled by resolveAssets' missingFileIds.
    let eventPageCleanup: { deletedPageIds: string[]; updatedPageIds: string[] } = {
      deletedPageIds: [],
      updatedPageIds: [],
    };
    try {
      eventPageCleanup = await eventPageService.pruneDeletedExplorerReferences(result.deletedIds);
    } catch (pruneError) {
      console.warn(
        '[API /explorer DELETE] Event page prune failed (orphans will self-heal):',
        pruneError
      );
    }

    revalidatePath('/', 'layout');
    return success({ ...result, eventPageCleanup }, 'Node deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Node not found') return notFound(message);
    console.error('[API /explorer DELETE] Error:', error);
    return serverError('Failed to delete node');
  }
}
