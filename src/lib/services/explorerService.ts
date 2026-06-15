// ═══════════════════════════════════════════════════════════════════
// SECTION MAP (explorerService.ts — 684 lines)
// L1-16:    Imports, types (ExplorerDeleteResult)
// L17-56:   Utility helpers: cloneNodeMap, sleep, runExplorerMutation
// L57-104:  readExplorerRoot, mutateExplorerNodes — D1 read/write ops
// L105-140: Path/name utilities: normalizeParentId, sanitizeStorageBase,
//           storageKeyForName, fileNameFromStorageKey
// L141-400: CRUD operations: createFolder, createFile, renameNode, moveNode
// L401-684: deleteNode (atomic D1+R2), copyNode, TOCTOU guards,
//           virtual tree rebuild on R2 key changes
// ═══════════════════════════════════════════════════════════════════
import { compareAndSetD1Value, getD1Value } from '@/lib/cloudflareD1';
import {
  buildR2PublicUrl,
  copyR2Object,
  deleteFromR2,
  isR2StorageConfigured,
} from '@/lib/r2Storage';
import { extractStoragePath } from '@/lib/urlResolver';
import type { AnyExplorerNode, ExplorerFile, ExplorerFolder } from '@/types/explorer';
import { v4 as uuidv4 } from 'uuid';

const EXPLORER_ROOT_KEY = 'explorer';
const EXPLORER_STORAGE_ROOT = 'assets/explorer';
const LEGACY_EXPLORER_STORAGE_ROOT = 'assets/media/';
const MAX_D1_WRITE_RETRIES = 8;

export type ExplorerDeleteResult = {
  deletedIds: string[];
  storageDeleted: string[];
  storageErrors: Array<{ key: string; message: string }>;
};

type ExplorerNodeMap = Record<string, AnyExplorerNode>;
type ExplorerRoot = {
  nodes?: ExplorerNodeMap;
  [key: string]: unknown;
};
type StorageMovePlan = {
  updates: Partial<ExplorerFile>;
  copiedKeys: string[];
  sourceKeysToDelete: string[];
};
type ExplorerNodeMutation<T> = {
  nodes: ExplorerNodeMap;
  result: T;
};

let explorerMutationChain: Promise<void> = Promise.resolve();

function cloneNodeMap(nodes: ExplorerNodeMap): ExplorerNodeMap {
  return JSON.parse(JSON.stringify(nodes)) as ExplorerNodeMap;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runExplorerMutation<T>(operation: () => Promise<T>): Promise<T> {
  const run = explorerMutationChain.then(operation, operation);
  explorerMutationChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readExplorerRoot() {
  return await getD1Value<ExplorerRoot>(EXPLORER_ROOT_KEY);
}

async function mutateExplorerNodes<T>(
  mutator: (nodes: ExplorerNodeMap) => ExplorerNodeMutation<T> | Promise<ExplorerNodeMutation<T>>
) {
  return runExplorerMutation(async () => {
    for (let attempt = 0; attempt < MAX_D1_WRITE_RETRIES; attempt++) {
      const currentRoot = await readExplorerRoot();
      const currentNodes = cloneNodeMap(currentRoot?.nodes || {});
      const mutation = await mutator(currentNodes);
      const nextRoot: ExplorerRoot = {
        ...(currentRoot || {}),
        nodes: mutation.nodes,
      };

      if (await compareAndSetD1Value(EXPLORER_ROOT_KEY, currentRoot, nextRoot)) {
        return mutation.result;
      }

      await sleep(20 * (attempt + 1));
    }

    throw new Error('Explorer data changed too quickly; please retry');
  });
}

function normalizeParentId(id: string | null | undefined) {
  return !id || id === 'root' || id === 'null' || id === 'undefined' ? null : id;
}

function explorerFolderKey(parentId: string | null | undefined) {
  return `${EXPLORER_STORAGE_ROOT}/${normalizeParentId(parentId) || 'root'}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/[\\/]/g, '-').replace(/\s+/g, ' ');
}

function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

function extensionFromName(name?: string | null) {
  return name?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || '';
}

function extensionFromKey(key?: string | null) {
  return (
    key
      ?.split('/')
      .pop()
      ?.match(/\.([a-z0-9]+)$/i)?.[1]
      ?.toLowerCase() || ''
  );
}

function sanitizeStorageBase(name: string) {
  const base = stripExtension(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'file';
}

function storageKeyForName(
  parentId: string | null,
  name: string,
  nodeId: string,
  currentKey?: string
) {
  const currentExtension = extensionFromKey(currentKey);
  const requestedExtension = name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const extension = currentExtension || requestedExtension || 'bin';
  const base = sanitizeStorageBase(name);
  return `${explorerFolderKey(parentId)}/${base}-${nodeId.slice(0, 8)}.${extension}`;
}

function fileNameFromStorageKey(key: string, fallback: string) {
  return key.split('/').pop() || fallback;
}

function getDisplayFileName(file: ExplorerFile) {
  return file.originalName?.trim() || file.name;
}

function ensureDisplayFileName(file: ExplorerFile, requestedName: string) {
  const cleanRequested = normalizeName(requestedName);
  if (!cleanRequested) return cleanRequested;

  const requestedExtension = extensionFromName(cleanRequested);
  if (requestedExtension) {
    return cleanRequested;
  }

  const fallbackExtension =
    extensionFromName(getDisplayFileName(file)) ||
    extensionFromKey(file.storageKey || extractStoragePath(file.url)) ||
    file.metadata?.actualExtension ||
    file.metadata?.extension ||
    '';

  return fallbackExtension ? `${cleanRequested}.${fallbackExtension}` : cleanRequested;
}

function isStorageManagedByExplorer(file: ExplorerFile, key: string) {
  return (
    file.metadata?.ownedBy === 'explorer' ||
    Boolean(file.storageKey) ||
    key.startsWith(`${EXPLORER_STORAGE_ROOT}/`) ||
    key.startsWith(LEGACY_EXPLORER_STORAGE_ROOT)
  );
}

function deriveVideoSidecarKeys(mainKey: string) {
  const base = mainKey.replace(/\.(mp4|webm|mov)$/i, '');
  if (base === mainKey) return [];
  return [`${base}-preview.mp4`, `${base}.jpg`];
}

function collectFileStorageKeys(file: ExplorerFile) {
  const keys = new Set<string>();
  const mainKey = file.storageKey || extractStoragePath(file.url);

  if (mainKey && isStorageManagedByExplorer(file, mainKey)) {
    keys.add(mainKey);
    if (file.fileType === 'video') {
      for (const sidecarKey of deriveVideoSidecarKeys(mainKey)) {
        keys.add(sidecarKey);
      }
    }
  }

  const sidecarCandidates = [
    file.previewKey,
    file.thumbnailKey,
    file.previewUrl ? extractStoragePath(file.previewUrl) : null,
    file.thumbnailUrl ? extractStoragePath(file.thumbnailUrl) : null,
  ];

  for (const key of sidecarCandidates) {
    if (key && isStorageManagedByExplorer(file, key)) {
      keys.add(key);
    }
  }

  return Array.from(keys);
}

async function readNodeMap(): Promise<ExplorerNodeMap> {
  const root = await readExplorerRoot();
  return cloneNodeMap(root?.nodes || {});
}

function collectNodeAndDescendantIds(data: ExplorerNodeMap, nodeId: string) {
  const childrenMap = new Map<string, string[]>();
  for (const node of Object.values(data)) {
    const parentId = normalizeParentId(node.parentId);
    if (parentId) {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(node.id);
    }
  }

  const ids = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (!ids.has(currentId)) {
      ids.add(currentId);
      const children = childrenMap.get(currentId);
      if (children) {
        queue.push(...children);
      }
    }
  }

  return Array.from(ids);
}

function isDescendant(data: ExplorerNodeMap, possibleChildId: string, parentId: string) {
  let currentId: string | null = possibleChildId;
  let depth = 0;

  while (currentId && depth < 100) {
    if (currentId === parentId) return true;
    currentId = normalizeParentId(data[currentId]?.parentId);
    depth++;
  }

  return false;
}

function resolveTargetParent(data: ExplorerNodeMap, parentId: string | null) {
  if (!parentId) return null;
  const parent = data[parentId];
  return parent?.type === 'folder' ? parent.id : undefined;
}

async function deleteStorageKeys(keys: string[]) {
  const storageDeleted: string[] = [];
  const storageErrors: Array<{ key: string; message: string }> = [];

  if (keys.length === 0) {
    return { storageDeleted, storageErrors };
  }

  if (!isR2StorageConfigured()) {
    return {
      storageDeleted,
      storageErrors: keys.map((key) => ({
        key,
        message: 'Cloudflare R2 env is incomplete',
      })),
    };
  }

  for (const key of keys) {
    try {
      await deleteFromR2(key);
      storageDeleted.push(key);
    } catch (error) {
      storageErrors.push({
        key,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { storageDeleted, storageErrors };
}

/**
 * Copy file storage from one R2 path to another.
 *
 * IMPORTANT: S3/R2 API does not have native rename. This function
 * performs a full server-side COPY then queues the source for DELETE
 * after D1 commit. For large files (videos), the copy can be slow
 * (seconds-to-minutes depending on size and R2 region latency).
 * This is an inherent platform limitation, not an implementation bug.
 *
 * If copy fails partway through (e.g. main copied but preview fails),
 * all already-copied keys are rolled back via deleteFromR2.
 */
async function copyFileStorage(
  file: ExplorerFile,
  parentId: string | null,
  nextName?: string
): Promise<StorageMovePlan> {
  const sourceMainKey = file.storageKey || extractStoragePath(file.url);
  if (!sourceMainKey || !isStorageManagedByExplorer(file, sourceMainKey)) {
    return { updates: {}, copiedKeys: [], sourceKeysToDelete: [] };
  }

  if (!isR2StorageConfigured()) {
    throw new Error('Cloudflare R2 env is incomplete');
  }

  const targetMainKey = nextName
    ? storageKeyForName(parentId, nextName, file.id, sourceMainKey)
    : `${explorerFolderKey(parentId)}/${fileNameFromStorageKey(sourceMainKey, file.name)}`;

  const copiedKeys: string[] = [];
  const sourceKeysToDelete: string[] = [];

  try {
    const updates: Partial<ExplorerFile> = {
      storageKey: targetMainKey,
      url: buildR2PublicUrl(targetMainKey),
    };

    if (sourceMainKey !== targetMainKey) {
      await copyR2Object(sourceMainKey, targetMainKey);
      copiedKeys.push(targetMainKey);
      sourceKeysToDelete.push(sourceMainKey);
    }

    const sourcePreviewKey =
      file.previewKey || (file.previewUrl ? extractStoragePath(file.previewUrl) : null);
    const sourceThumbnailKey =
      file.thumbnailKey || (file.thumbnailUrl ? extractStoragePath(file.thumbnailUrl) : null);
    const targetBase = targetMainKey.replace(/\.[^.]+$/, '');

    if (sourcePreviewKey && isStorageManagedByExplorer(file, sourcePreviewKey)) {
      const targetPreviewKey = `${targetBase}-preview.mp4`;
      if (sourcePreviewKey !== targetPreviewKey) {
        await copyR2Object(sourcePreviewKey, targetPreviewKey);
        copiedKeys.push(targetPreviewKey);
        sourceKeysToDelete.push(sourcePreviewKey);
      }
      updates.previewKey = targetPreviewKey;
      updates.previewUrl = buildR2PublicUrl(targetPreviewKey);
    }

    if (sourceThumbnailKey && isStorageManagedByExplorer(file, sourceThumbnailKey)) {
      const targetThumbnailKey = `${targetBase}.jpg`;
      if (sourceThumbnailKey !== targetThumbnailKey) {
        await copyR2Object(sourceThumbnailKey, targetThumbnailKey);
        copiedKeys.push(targetThumbnailKey);
        sourceKeysToDelete.push(sourceThumbnailKey);
      }
      updates.thumbnailKey = targetThumbnailKey;
      updates.thumbnailUrl = buildR2PublicUrl(targetThumbnailKey);
    }

    return { updates, copiedKeys, sourceKeysToDelete };
  } catch (error) {
    await Promise.all(
      copiedKeys.map((key) =>
        deleteFromR2(key).catch((deleteError) => {
          console.warn('[ExplorerService] Failed to rollback copied key:', key, deleteError);
        })
      )
    );
    throw error;
  }
}

async function deleteMovedSourceKeys(keys: string[]) {
  await Promise.all(
    keys.map((key) =>
      deleteFromR2(key).catch((error) => {
        console.warn('[ExplorerService] Failed to delete moved source key:', key, error);
      })
    )
  );
}

async function rollbackCopiedKeys(keys: string[]) {
  await Promise.all(
    keys.map((key) =>
      deleteFromR2(key).catch((error) => {
        console.warn('[ExplorerService] Failed to rollback copied key:', key, error);
      })
    )
  );
}

export const explorerService = {
  async getAllNodes(): Promise<AnyExplorerNode[]> {
    try {
      const data = await readNodeMap();
      return Object.values(data);
    } catch (error) {
      console.error('[ExplorerService] Failed to get all nodes:', error);
      return [];
    }
  },

  async getNodes(parentId: string | null = null): Promise<AnyExplorerNode[]> {
    const normalizedParentId = normalizeParentId(parentId);

    try {
      const data = await readNodeMap();
      return Object.values(data).filter(
        (node) => normalizeParentId(node.parentId) === normalizedParentId
      );
    } catch (error) {
      console.error('[ExplorerService] Failed to get nodes:', error);
      return [];
    }
  },

  async getNode(nodeId: string): Promise<AnyExplorerNode | null> {
    try {
      const data = await readNodeMap();
      return data[nodeId] || null;
    } catch (error) {
      console.error(`[ExplorerService] Failed to get node ${nodeId}:`, error);
      return null;
    }
  },

  async createFolder(name: string, parentId: string | null): Promise<ExplorerFolder> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const folder: ExplorerFolder = {
      id,
      type: 'folder',
      name: normalizeName(name),
      parentId: normalizeParentId(parentId),
      createdAt: now,
      updatedAt: now,
    };

    return mutateExplorerNodes((nodes) => {
      nodes[id] = folder;
      return { nodes, result: folder };
    });
  },

  async createFile(
    fileData: Omit<ExplorerFile, 'id' | 'type' | 'createdAt' | 'updatedAt'>
  ): Promise<ExplorerFile> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const fileNode: ExplorerFile = {
      ...fileData,
      name: normalizeName(fileData.name),
      parentId: normalizeParentId(fileData.parentId),
      id,
      type: 'file',
      createdAt: now,
      updatedAt: now,
    };

    return mutateExplorerNodes((nodes) => {
      nodes[id] = fileNode;
      return { nodes, result: fileNode };
    });
  },

  async deleteNode(nodeId: string): Promise<ExplorerDeleteResult> {
    const mutation = await mutateExplorerNodes((nodes) => {
      const node = nodes[nodeId];
      if (!node) {
        throw new Error('Node not found');
      }

      const deletedIds = collectNodeAndDescendantIds(nodes, nodeId);
      const storageKeys = new Set<string>();

      for (const id of deletedIds) {
        const candidate = nodes[id];
        if (candidate?.type === 'file') {
          for (const key of collectFileStorageKeys(candidate)) {
            storageKeys.add(key);
          }
        }
      }

      for (const id of deletedIds) {
        delete nodes[id];
      }

      return {
        nodes,
        result: {
          deletedIds,
          storageKeys: Array.from(storageKeys),
        },
      };
    });

    const { storageDeleted, storageErrors } = await deleteStorageKeys(mutation.storageKeys);
    if (storageErrors.length > 0) {
      console.warn(
        `[ExplorerService] deleteNode: ${storageErrors.length} R2 object(s) failed to delete (now orphans, visible in storage-stats audit):`,
        storageErrors
      );
    }

    return {
      deletedIds: mutation.deletedIds,
      storageDeleted,
      storageErrors,
    };
  },

  async renameNode(nodeId: string, newName: string): Promise<AnyExplorerNode> {
    const data = await readNodeMap();
    const node = data[nodeId];
    if (!node) {
      throw new Error('Node not found');
    }

    const cleanName = normalizeName(newName);
    if (!cleanName) {
      throw new Error('Name is required');
    }

    const updates: Partial<AnyExplorerNode> & Partial<ExplorerFile> = {
      name: cleanName,
      updatedAt: new Date().toISOString(),
    };

    let storagePlan: StorageMovePlan | null = null;
    if (node.type === 'file') {
      const displayName = ensureDisplayFileName(node, cleanName);
      updates.name = displayName;
      updates.originalName = displayName;
      storagePlan = await copyFileStorage(node, normalizeParentId(node.parentId), displayName);
      Object.assign(updates, storagePlan.updates);
      const actualExtension = extensionFromKey(
        storagePlan.updates.storageKey || node.storageKey || extractStoragePath(node.url)
      );
      if (actualExtension) {
        updates.metadata = {
          ...node.metadata,
          extension: actualExtension,
          actualExtension,
          ownedBy: node.metadata?.ownedBy || 'explorer',
        };
      }
    }

    // Commit against the latest D1 state so a concurrent delete/update
    // cannot resurrect stale file metadata.
    try {
      const updatedNode = await mutateExplorerNodes((nodes) => {
        const current = nodes[nodeId];
        if (!current) {
          throw new Error('Node not found');
        }
        if (current.updatedAt !== node.updatedAt) {
          throw new Error('Node changed while update was in progress');
        }
        const nextNode = { ...current, ...updates } as AnyExplorerNode;
        nodes[nodeId] = nextNode;
        return { nodes, result: nextNode };
      });

      if (storagePlan) {
        await deleteMovedSourceKeys(storagePlan.sourceKeysToDelete);
      }

      return updatedNode;
    } catch (error) {
      if (storagePlan) {
        await rollbackCopiedKeys(storagePlan.copiedKeys);
      }
      throw error;
    }
  },

  async moveNode(nodeId: string, parentId: string | null): Promise<AnyExplorerNode> {
    const data = await readNodeMap();
    const node = data[nodeId];
    if (!node) {
      throw new Error('Node not found');
    }

    const normalizedParentId = normalizeParentId(parentId);
    const resolvedParentId = resolveTargetParent(data, normalizedParentId);
    if (resolvedParentId === undefined) {
      throw new Error('Target folder not found');
    }

    if (node.type === 'folder' && normalizedParentId) {
      if (node.id === normalizedParentId || isDescendant(data, normalizedParentId, node.id)) {
        throw new Error('Cannot move a folder into itself or its descendant');
      }
    }

    // No-op if already in the target folder
    if (normalizeParentId(node.parentId) === resolvedParentId) {
      return node;
    }

    const updates: Partial<AnyExplorerNode> = {
      parentId: resolvedParentId,
      updatedAt: new Date().toISOString(),
    };

    let storagePlan: StorageMovePlan | null = null;
    if (node.type === 'file') {
      storagePlan = await copyFileStorage(node, resolvedParentId);
      Object.assign(updates, storagePlan.updates);
    }

    // Commit against the latest D1 state and re-check the target folder.
    try {
      const updatedNode = await mutateExplorerNodes((nodes) => {
        const current = nodes[nodeId];
        if (!current) {
          throw new Error('Node not found');
        }
        if (current.updatedAt !== node.updatedAt) {
          throw new Error('Node changed while update was in progress');
        }
        if (resolvedParentId && nodes[resolvedParentId]?.type !== 'folder') {
          throw new Error('Target folder not found');
        }
        if (
          current.type === 'folder' &&
          resolvedParentId &&
          (current.id === resolvedParentId || isDescendant(nodes, resolvedParentId, current.id))
        ) {
          throw new Error('Cannot move a folder into itself or its descendant');
        }

        const nextNode = { ...current, ...updates } as AnyExplorerNode;
        nodes[nodeId] = nextNode;
        return { nodes, result: nextNode };
      });

      if (storagePlan) {
        await deleteMovedSourceKeys(storagePlan.sourceKeysToDelete);
      }

      return updatedNode;
    } catch (error) {
      if (storagePlan) {
        await rollbackCopiedKeys(storagePlan.copiedKeys);
      }
      throw error;
    }
  },

  async getPath(nodeId: string | null): Promise<ExplorerFolder[]> {
    if (!nodeId) return [];
    try {
      const data = await readNodeMap();
      const path: ExplorerFolder[] = [];
      let currentId: string | null = normalizeParentId(nodeId);
      let depth = 0;

      while (currentId && depth < 100) {
        const node = data[currentId];
        if (!node || node.type !== 'folder') break;

        path.unshift(node);
        currentId = normalizeParentId(node.parentId);
        depth++;
      }

      return path;
    } catch (error) {
      console.error('[ExplorerService] Failed to get path:', error);
      return [];
    }
  },
};
