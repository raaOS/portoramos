export type NodeType = 'folder' | 'file';
export type FileKind = 'image' | 'video' | 'pdf' | 'text';

export interface ExplorerNode {
    id: string;
    type: NodeType;
    name: string;
    parentId: string | null; // null for root
    createdAt: string;
    updatedAt: string;
}

export interface ExplorerFolder extends ExplorerNode {
    type: 'folder';
    icon?: string; // Optional custom icon
}

export interface ExplorerFile extends ExplorerNode {
    type: 'file';
    fileType: FileKind;
    url: string;
    previewUrl?: string;
    thumbnailUrl?: string; // High res thumb
    size?: number; // bytes
    metadata?: {
        width?: number;
        height?: number;
        duration?: number; // for video
        extension: string;
    };
}

export type AnyExplorerNode = ExplorerFolder | ExplorerFile;
