import { NextRequest } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { explorerService } from '@/lib/services/explorerService';
import { success, created, unauthorized, serverError } from '@/lib/api-response';
import { ExplorerFolder } from '@/types/explorer';

export const dynamic = 'force-dynamic';

// GET - List nodes by parentId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let parentId = searchParams.get('parentId');
    console.log(`[API /explorer GET] Incoming parentId query: "${parentId}"`);

    if (!parentId || parentId === 'root' || parentId === 'undefined') {
      parentId = null;
    }
    const includePath = searchParams.get('path') === 'true';

    const nodes = await explorerService.getNodes(parentId);
    let path: ExplorerFolder[] = [];

    if (includePath && parentId) {
      path = await explorerService.getPath(parentId);
    }

    console.log(
      `[API /explorer GET] Success: parentId=${parentId}, nodes.length=${nodes.length}, path.length=${path.length}`
    );
    return success({ nodes, path });
  } catch (error) {
    console.error('[API /explorer GET] Error:', error);
    return serverError('Failed to load explorer nodes');
  }
}

// POST - Create Folder or File (Admin only)
export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized();
    }

    const body = await request.json();
    const { type = 'folder', parentId = null } = body;

    if (type === 'folder') {
      const { name } = body;
      if (!name) return serverError('Folder name is required');
      const folder = await explorerService.createFolder(name, parentId);
      return created(folder, 'Folder created successfully');
    }

    if (type === 'file') {
      const { name, url, previewUrl, thumbnailUrl, fileType, size, metadata } = body;
      if (!name || !url || !fileType) {
        return serverError('Missing required file information (name, url, or fileType)');
      }

      const file = await explorerService.createFile({
        name,
        url,
        previewUrl,
        thumbnailUrl,
        fileType,
        parentId,
        size,
        metadata,
      });
      return created(file, 'File uploaded and registered successfully');
    }

    return serverError('Invalid node type');
  } catch (error) {
    console.error('[API /explorer POST] Error:', error);
    return serverError('Failed to create node');
  }
}

// DELETE - Delete Node (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return serverError('ID is required');
    }

    const deleted = await explorerService.deleteNode(id);
    if (!deleted) return serverError('Failed to delete node');

    return success({ message: 'Node deleted successfully' });
  } catch (error) {
    console.error('[API /explorer DELETE] Error:', error);
    return serverError('Failed to delete node');
  }
}
