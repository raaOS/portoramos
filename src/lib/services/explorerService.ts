import { db } from '@/lib/firebaseAdmin';
import { AnyExplorerNode, ExplorerFolder, ExplorerFile } from '@/types/explorer';
import { v4 as uuidv4 } from 'uuid';

const EXPLORER_PATH = 'explorer/nodes';

export const explorerService = {
    /**
     * Get all nodes in a flat map (useful for lookups) or children of a specific folder.
     */
    async getNodes(parentId: string | null = null): Promise<AnyExplorerNode[]> {
        try {
            const snapshot = await db.ref(EXPLORER_PATH).once('value');
            const data = snapshot.val() as Record<string, AnyExplorerNode> | null;
            
            if (!data) return [];
            
            // Filter by parentId (handle undefined or empty string as null)
            return Object.values(data).filter(node => {
                const nodeParentId = (node.parentId === undefined || node.parentId === '') ? null : node.parentId;
                const normalizePid = (parentId === '' || parentId === undefined) ? null : parentId;
                return nodeParentId === normalizePid;
            });
        } catch (error) {
            console.error('[ExplorerService] Failed to get nodes:', error);
            return [];
        }
    },

    /**
     * Get a specific node by ID
     */
    async getNode(id: string): Promise<AnyExplorerNode | null> {
        try {
            const snapshot = await db.ref(`${EXPLORER_PATH}/${id}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error(`[ExplorerService] Failed to get node ${id}:`, error);
            return null;
        }
    },

    /**
     * Create a new folder
     */
    async createFolder(name: string, parentId: string | null): Promise<ExplorerFolder> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        const folder: ExplorerFolder = {
            id,
            type: 'folder',
            name,
            parentId: parentId || null, // Guard against undefined/empty
            createdAt: now,
            updatedAt: now
        };

        console.log(`[ExplorerService] Creating folder: ${name} (${id}) under parent: ${parentId || 'Root'}`);
        await db.ref(`${EXPLORER_PATH}/${id}`).set(folder);
        return folder;
    },

    /**
     * Save a file entry
     */
    async createFile(fileData: Omit<ExplorerFile, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<ExplorerFile> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        const fileNode: ExplorerFile = {
            ...fileData,
            parentId: fileData.parentId || null, // Guard against undefined/empty
            id,
            type: 'file',
            createdAt: now,
            updatedAt: now
        };

        console.log(`[ExplorerService] Creating file: ${fileNode.name} (${id}) under parent: ${fileNode.parentId || 'Root'}`);
        await db.ref(`${EXPLORER_PATH}/${id}`).set(fileNode);
        return fileNode;
    },

    /**
     * Delete a node (folder or file)
     * TODO: Implement recursive deletion for folders if needed.
     */
    async deleteNode(id: string): Promise<boolean> {
        try {
            // If it's a folder, we should also delete its children (simplified here)
            await db.ref(`${EXPLORER_PATH}/${id}`).remove();
            return true;
        } catch (error) {
            console.error(`[ExplorerService] Failed to delete node ${id}:`, error);
            return false;
        }
    },

    /**
     * Rename a node
     */
    async renameNode(id: string, newName: string): Promise<boolean> {
        try {
            await db.ref(`${EXPLORER_PATH}/${id}`).update({
                name: newName,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error(`[ExplorerService] Failed to rename node ${id}:`, error);
            return false;
        }
    },

    /**
     * Get the full path (ancestors) for a given node
     */
    async getPath(id: string | null): Promise<ExplorerFolder[]> {
        if (!id) return [];
        try {
            const snapshot = await db.ref(EXPLORER_PATH).once('value');
            const data = snapshot.val() as Record<string, AnyExplorerNode> | null;
            if (!data) return [];

            const path: ExplorerFolder[] = [];
            let currentId: string | null = id;

            // Prevent infinite loops just in case
            let depth = 0;
            while (currentId && depth < 20) {
                const node = data[currentId] as AnyExplorerNode | undefined;
                if (!node || node.type !== 'folder') break;
                
                path.unshift(node as ExplorerFolder);
                currentId = (node.parentId === undefined || node.parentId === '') ? null : node.parentId;
                depth++;
            }

            return path;
        } catch (error) {
            console.error('[ExplorerService] Failed to get path:', error);
            return [];
        }
    }
};
