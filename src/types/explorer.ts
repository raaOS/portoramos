/** Type definitions untuk virtual file explorer (folders, files, nodes). @module */
export type NodeType = 'folder' | 'file';
export type FileKind = 'image' | 'video' | 'audio' | 'pdf' | 'text';

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
  storageKey?: string;
  previewKey?: string;
  thumbnailKey?: string;
  mimeType?: string;
  originalName?: string;
  size?: number; // bytes
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // for video
    extension: string;
    actualExtension?: string;
    ownedBy?: 'explorer' | 'external';
  };
}

export type AnyExplorerNode = ExplorerFolder | ExplorerFile;
