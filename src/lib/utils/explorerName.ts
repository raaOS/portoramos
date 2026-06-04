import type { AnyExplorerNode, ExplorerFile } from '@/types/explorer';

function cleanLabel(value?: string | null) {
  return value?.trim() || '';
}

export function getExplorerFileDisplayName(file: Pick<ExplorerFile, 'name' | 'originalName'>) {
  return cleanLabel(file.originalName) || cleanLabel(file.name);
}

export function getExplorerNodeDisplayName(node: AnyExplorerNode) {
  if (node.type === 'file') {
    return getExplorerFileDisplayName(node);
  }

  return cleanLabel(node.name);
}

export function getExplorerActualFormat(file: Pick<ExplorerFile, 'mimeType' | 'metadata' | 'url'>) {
  const extension =
    cleanLabel(file.metadata?.actualExtension) ||
    cleanLabel(file.metadata?.extension) ||
    cleanLabel(file.mimeType?.split('/').pop()) ||
    cleanLabel(file.url.split('.').pop());

  return extension ? extension.toUpperCase() : 'FILE';
}
