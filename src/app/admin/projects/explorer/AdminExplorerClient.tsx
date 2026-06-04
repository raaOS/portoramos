'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Folder,
  File,
  Trash2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Search,
  Home,
  FolderPlus,
  Upload,
  Check,
  Loader2,
  XCircle,
  Pencil,
  FolderInput,
} from 'lucide-react';
import { AdminHeader } from '../../components/components/AdminHeader';
import { ExplorerFormatBadge } from '@/components/ui/ExplorerFormatBadge';
import { useToast } from '@/contexts/ToastContext';
import { getExplorerActualFormat, getExplorerNodeDisplayName } from '@/lib/utils/explorerName';
import { AnyExplorerNode, ExplorerFolder } from '@/types/explorer';
import AdminButton from '@/app/admin/components/AdminButton';
import { m } from 'motion/react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { useFFmpeg } from '@/app/admin/components/file-upload/hooks';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import AdminLoading from '@/components/admin/AdminLoading';

type UploadResult = {
  url: string;
  previewUrl?: string;
  posterUrl?: string;
  storagePath?: string;
  previewPath?: string;
  posterPath?: string;
  finalFilename?: string;
  contentType?: string;
  videoStats?: { optimizedSize: number };
  imageStats?: { optimizedSize: number };
  audioStats?: { optimizedSize: number };
};

type MoveTarget = {
  id: string | null;
  label: string;
};

export default function AdminExplorerClient() {
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [nodes, setNodes] = useState<AnyExplorerNode[]>([]);
  const [pathNodes, setPathNodes] = useState<ExplorerFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [moveDialog, setMoveDialog] = useState<{
    node: AnyExplorerNode;
    targets: MoveTarget[];
    selectedParentId: string | null;
  } | null>(null);
  const [activeUploads, setActiveUploads] = useState<
    Record<
      string,
      {
        id: string;
        name: string;
        progress: number;
        status: 'compressing' | 'uploading' | 'registering' | 'success' | 'error';
        error?: string;
      }
    >
  >({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useToast();
  const { csrfToken } = useAdminAuth();
  const ignoreCompressionStatus = useCallback(() => undefined, []);
  const { compressVideo } = useFFmpeg(ignoreCompressionStatus);
  const { confirm, prompt } = useConfirm();
  const compressChainRef = React.useRef<Promise<void>>(Promise.resolve());
  const currentParentIdRef = React.useRef<string | null>(null);
  const historyIndexRef = React.useRef(-1);

  useEffect(() => {
    currentParentIdRef.current = currentParentId;
  }, [currentParentId]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // Fetch nodes
  const fetchNodes = useCallback(
    async (parentId: string | null) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/explorer?parentId=${parentId || ''}&path=true&_t=${Date.now()}`
        );
        const result = await res.json();
        if (result.success && result.data?.nodes) {
          setNodes(result.data.nodes);
          setPathNodes(result.data.path || []);
        }
      } catch (error) {
        console.error('[AdminExplorer] Fetch error:', error);
        showError('Gagal mengambil data explorer');
      } finally {
        setIsLoading(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchNodes(currentParentId);
    });
  }, [currentParentId, fetchNodes]);

  // Navigation logic
  const navigateTo = useCallback(
    (id: string | null, addToHistory = true) => {
      if (addToHistory) {
        setHistory((prev) => {
          const newHistory = prev.slice(0, (historyIndexRef.current ?? -1) + 1);
          newHistory.push(id);
          return newHistory;
        });
        setHistoryIndex((prev) => {
          historyIndexRef.current = prev + 1;
          return prev + 1;
        });
      }
      setCurrentParentId(id);
    },
    []
  );

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentParentId(history[newIndex]);
    }
  }, [history, historyIndex]);

  const buildMoveTargets = useCallback(
    (allNodes: AnyExplorerNode[], nodeToMove: AnyExplorerNode) => {
      const folders = allNodes.filter((node): node is ExplorerFolder => node.type === 'folder');
      const folderMap = new Map(folders.map((folder) => [folder.id, folder]));

      const isDescendant = (folderId: string) => {
        let current = folderMap.get(folderId);
        let depth = 0;
        while (current && depth < 100) {
          if (current.parentId === nodeToMove.id) return true;
          current = current.parentId ? folderMap.get(current.parentId) : undefined;
          depth++;
        }
        return false;
      };

      const labelFor = (folder: ExplorerFolder) => {
        const parts = [folder.name];
        let current = folder.parentId ? folderMap.get(folder.parentId) : undefined;
        let depth = 0;
        while (current && depth < 100) {
          parts.unshift(current.name);
          current = current.parentId ? folderMap.get(current.parentId) : undefined;
          depth++;
        }
        return parts.join(' / ');
      };

      return [
        { id: null, label: 'Root' },
        ...folders
          .filter((folder) => {
            if (folder.id === nodeToMove.id) return false;
            if (nodeToMove.type === 'folder' && isDescendant(folder.id)) return false;
            return true;
          })
          .map((folder) => ({ id: folder.id, label: labelFor(folder) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ];
    },
    []
  );

  // CRUD Handlers
  const handleCreateFolder = async () => {
    const name = await prompt({
      title: 'Buat folder baru',
      message: 'Beri nama untuk folder explorer baru.',
      placeholder: 'Nama folder',
      confirmText: 'Buat',
      maxLength: 80,
    });
    if (!name) return;

    try {
      const token = getWritableCsrfToken(csrfToken);
      const res = await fetch('/api/explorer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          name,
          type: 'folder',
          parentId: currentParentId,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        const newFolder = result.data;
        showSuccess(`Folder "${name}" berhasil dibuat`);

        // Auto-navigate to the new folder
        if (newFolder && newFolder.id) {
          navigateTo(newFolder.id);
        } else {
          fetchNodes(currentParentId);
        }
      } else {
        showError('Gagal membuat folder');
      }
    } catch (err) {
      console.error(err);
      showError('Terjadi kesalahan sistem');
    }
  };

  const handleDeleteNode = async (node: AnyExplorerNode) => {
    const nodeLabel = getExplorerNodeDisplayName(node);
    const ok = await confirm({
      title: `Hapus ${node.type === 'folder' ? 'folder' : 'file'}?`,
      message:
        node.type === 'folder'
          ? `"${nodeLabel}" dan semua isi foldernya akan dihapus permanen dari D1 dan storage Explorer.`
          : `"${nodeLabel}" akan dihapus permanen dari D1 dan storage Explorer.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const token = getWritableCsrfToken(csrfToken);
      const res = await fetch(`/api/explorer?id=${node.id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': token,
        },
      });
      if (res.ok) {
        showSuccess('Berhasil dihapus');
        fetchNodes(currentParentId);
      } else {
        showError('Gagal menghapus');
      }
    } catch (err) {
      console.error(err);
      showError('Terjadi kesalahan sistem');
    }
  };

  const handleRenameNode = async (node: AnyExplorerNode) => {
    const currentLabel = getExplorerNodeDisplayName(node);
    const name = await prompt({
      title: `Rename ${node.type === 'folder' ? 'folder' : 'file'}`,
      message:
        node.type === 'file'
          ? 'Nama file dan key storage Explorer akan disinkronkan.'
          : 'Nama folder di Explorer akan diperbarui.',
      defaultValue: currentLabel,
      placeholder: 'Nama baru',
      confirmText: 'Simpan',
      maxLength: 120,
      validate: (value) => {
        if (/[\\/]/.test(value)) return 'Nama tidak boleh berisi slash';
        return null;
      },
    });
    if (!name || name === currentLabel) return;

    try {
      const res = await fetch('/api/explorer', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getWritableCsrfToken(csrfToken),
        },
        body: JSON.stringify({
          action: 'rename',
          id: node.id,
          name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal rename');
      }

      showSuccess('Nama berhasil diperbarui');
      fetchNodes(currentParentId);
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error.message : 'Gagal rename');
    }
  };

  const handleOpenMoveDialog = async (node: AnyExplorerNode) => {
    try {
      const res = await fetch(`/api/explorer?all=true&_t=${Date.now()}`);
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat daftar folder');
      }
      setMoveDialog({
        node,
        targets: buildMoveTargets(result.data.nodes || [], node),
        selectedParentId: node.parentId || null,
      });
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error.message : 'Gagal membuka pemindahan');
    }
  };

  const handleSubmitMove = async () => {
    if (!moveDialog) return;

    try {
      const res = await fetch('/api/explorer', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getWritableCsrfToken(csrfToken),
        },
        body: JSON.stringify({
          action: 'move',
          id: moveDialog.node.id,
          parentId: moveDialog.selectedParentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal memindahkan');
      }

      showSuccess('Item berhasil dipindahkan');
      setMoveDialog(null);
      fetchNodes(currentParentId);
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error.message : 'Gagal memindahkan');
    }
  };

  const getFileKind = (mimeType: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'text';
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const cleanupUploadedAssets = useCallback(
    async (uploadResult: UploadResult) => {
      const paths = [
        uploadResult.storagePath,
        uploadResult.previewPath,
        uploadResult.posterPath,
      ].filter((path): path is string => Boolean(path));
      await Promise.all(
        paths.map((path) =>
          fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
            method: 'DELETE',
            headers: {
              'x-csrf-token': getWritableCsrfToken(csrfToken),
            },
          }).catch((error) => {
            console.warn('[AdminExplorer] Failed to rollback uploaded asset:', path, error);
          })
        )
      );
    },
    [csrfToken]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    // Reset input immediately so same file can be chosen again
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsUploading(true);

    const uploadPromises = filesArray.map(async (file) => {
      const uploadId = Math.random().toString(36).substring(7);

      // Add to active uploads state for Optimistic UI
      setActiveUploads((prev) => ({
        ...prev,
        [uploadId]: {
          id: uploadId,
          name: file.name,
          progress: 0,
          status: 'uploading',
        },
      }));

      const updateUpload = (updates: Partial<(typeof activeUploads)[string]>) => {
        setActiveUploads((prev) => ({
          ...prev,
          [uploadId]: { ...prev[uploadId], ...updates },
        }));
      };

      try {
        let fileToUpload = file;
        let videoWasClientProcessed = false;

        if (file.type.startsWith('video/')) {
          updateUpload({ status: 'compressing', progress: 0 });
          await new Promise<void>((resolve, reject) => {
            compressChainRef.current = compressChainRef.current
              .then(async () => {
                try {
                  const originalSize = file.size;
                  fileToUpload = await compressVideo(file, (progress) =>
                    updateUpload({ progress })
                  );
                  videoWasClientProcessed = true;
                  showSuccess(
                    `Video optimized: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`
                  );
                } catch (error) {
                  console.warn(
                    '[AdminExplorer] Video compression failed, server will try fallback:',
                    error
                  );
                }
              })
              .then(resolve)
              .catch(reject);
          });
        }

        // 1. Upload to Storage using XMLHttpRequest to track progress
        const formData = new FormData();
        formData.append('file', fileToUpload);

        const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              updateUpload({ progress: percent });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) resolve(response);
                else reject(new Error(response.error || 'Upload failed'));
              } catch {
                reject(new Error('Invalid response from server'));
              }
            } else {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));

          const params = new URLSearchParams({
            folder: `assets/explorer/${currentParentIdRef.current || 'root'}`,
          });
          if (videoWasClientProcessed) {
            params.set('skipMainVideoOptimization', '1');
          }
          xhr.open('POST', `/api/upload?${params.toString()}`);
          xhr.setRequestHeader('x-csrf-token', getWritableCsrfToken(csrfToken));
          xhr.send(formData);
        });

        const uploadResult = await uploadPromise;

        // 2. Register in Explorer DB
        updateUpload({ status: 'registering', progress: 100 });

        const registeredName = uploadResult.finalFilename || fileToUpload.name;
        const actualExtension = registeredName.split('.').pop()?.toLowerCase() || '';
        const storedSize =
          uploadResult.videoStats?.optimizedSize ??
          uploadResult.imageStats?.optimizedSize ??
          uploadResult.audioStats?.optimizedSize ??
          fileToUpload.size;

        const explorerRes = await fetch('/api/explorer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getWritableCsrfToken(csrfToken),
          },
          body: JSON.stringify({
            type: 'file',
            parentId: currentParentId || null,
            name: file.name,
            url: uploadResult.url,
            previewUrl: uploadResult.previewUrl,
            thumbnailUrl: uploadResult.posterUrl,
            storageKey: uploadResult.storagePath,
            previewKey: uploadResult.previewPath,
            thumbnailKey: uploadResult.posterPath,
            mimeType: uploadResult.contentType || fileToUpload.type,
            originalName: file.name,
            fileType: getFileKind(fileToUpload.type),
            size: storedSize,
            metadata: {
              extension: actualExtension,
              actualExtension,
              ownedBy: 'explorer',
            },
          }),
        });

        const explorerPayload = await explorerRes.json().catch(() => null);

        if (explorerRes.ok && explorerPayload?.success && explorerPayload.data) {
          const createdFile = explorerPayload.data as AnyExplorerNode;
          if (
            createdFile.type === 'file' &&
            createdFile.parentId === (currentParentIdRef.current || null)
          ) {
            setNodes((prev) =>
              prev.some((node) => node.id === createdFile.id) ? prev : [...prev, createdFile]
            );
          }
          updateUpload({ status: 'success' });
          // Cleanup success item after 3 seconds
          setTimeout(() => {
            setActiveUploads((prev) => {
              const next = { ...prev };
              delete next[uploadId];
              return next;
            });
          }, 3000);
        } else {
          await cleanupUploadedAssets(uploadResult);
          throw new Error(explorerPayload?.error || 'Gagal mendaftarkan file');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Upload Error ${uploadId}]:`, err);
        updateUpload({ status: 'error', error: message, progress: 0 });
        showError(`Gagal upload "${file.name}": ${message}`);

        // Keep error for 5 seconds to let user see it
        setTimeout(() => {
          setActiveUploads((prev) => {
            const next = { ...prev };
            delete next[uploadId];
            return next;
          });
        }, 5000);
      }
    });

    await Promise.allSettled(uploadPromises);

    await fetchNodes(currentParentIdRef.current);
    setIsUploading(false);
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) =>
      getExplorerNodeDisplayName(node).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  const toolbarActions = (
    <div className="flex items-center gap-2">
      <AdminButton variant="primary" icon={<FolderPlus size={16} />} onClick={handleCreateFolder}>
        Folder Baru
      </AdminButton>
      <AdminButton
        variant="secondary"
        icon={isUploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
        onClick={handleUploadFile}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </AdminButton>
      <AdminButton variant="ghost" onClick={() => fetchNodes(currentParentId)}>
        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      </AdminButton>
    </div>
  );

  return (
    <>
      <AdminHeader title="Explorer Manager" actions={toolbarActions} />
      <div className="flex-1 space-y-6 p-6">
        <div className="space-y-4">
          {/* Search & Breadcrumbs */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 overflow-hidden text-sm text-gray-500">
              <button
                onClick={goBack}
                disabled={historyIndex <= 0}
                className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => navigateTo(null)}
                className="flex shrink-0 items-center gap-1.5 transition-colors hover:text-blue-600"
              >
                <Home size={14} /> Root
              </button>
              {pathNodes.map((folder) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight size={14} className="text-gray-300" />
                  <button
                    onClick={() => navigateTo(folder.id)}
                    className={`truncate transition-colors hover:text-blue-600 ${
                      folder.id === currentParentId ? 'font-medium text-gray-900' : ''
                    }`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari folder atau file..."
                className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Content Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Item
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {/* Optimistic Upload Rows */}
                {Object.values(activeUploads).map((upload) => (
                  <tr
                    key={upload.id}
                    className="animate-in fade-in slide-in-from-left-2 border-l-2 border-l-blue-500 bg-blue-50/20 duration-300"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex max-w-xs flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${upload.status === 'success' ? 'bg-green-100 text-green-600' : upload.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                          >
                            {upload.status === 'success' ? (
                              <Check size={18} />
                            ) : upload.status === 'error' ? (
                              <XCircle size={18} />
                            ) : (
                              <File size={18} className="animate-pulse" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-gray-900">
                              {upload.name}
                            </span>
                            <span
                              className={`text-[10px] ${upload.status === 'error' ? 'font-medium text-red-500' : 'text-gray-400'}`}
                            >
                              {upload.status === 'compressing'
                                ? `Optimizing video... ${upload.progress}%`
                                : upload.status === 'uploading'
                                  ? `Uploading... ${upload.progress}%`
                                  : upload.status === 'registering'
                                    ? 'Mendaftarkan file...'
                                    : upload.status === 'success'
                                      ? 'Selesai!'
                                      : upload.error}
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
                          <m.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${upload.progress}%`,
                            }}
                            style={{
                              backgroundColor:
                                upload.status === 'success'
                                  ? '#10b981'
                                  : upload.status === 'error'
                                    ? '#ef4444'
                                    : '#3b82f6',
                            }}
                            className="h-full transition-all duration-300 ease-out"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">
                        {(upload.status === 'uploading' || upload.status === 'compressing') && (
                          <Loader2 size={10} className="animate-spin" />
                        )}
                        {upload.status === 'success' ? 'COMPLETE' : 'PENDING'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center font-mono text-xs italic text-gray-500">
                      uploading...
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        {upload.status === 'uploading' || upload.status === 'compressing' ? (
                          <Loader2 size={16} className="animate-spin text-blue-400 opacity-50" />
                        ) : upload.status === 'success' ? (
                          <Check size={16} className="text-green-500" />
                        ) : upload.status === 'error' ? (
                          <XCircle size={16} className="text-red-500" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <AdminLoading size="page" />
                    </td>
                  </tr>
                ) : filteredNodes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Folder size={48} strokeWidth={1} />
                        <p className="text-sm font-medium">Folder ini kosong</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNodes.map((node) => (
                    <tr key={node.id} className="group transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div
                          className="flex cursor-pointer items-center gap-3 transition-colors group-hover:text-blue-600"
                          onClick={() => node.type === 'folder' && navigateTo(node.id)}
                        >
                          <div
                            className={`rounded-lg p-2 ${node.type === 'folder' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'}`}
                          >
                            {node.type === 'folder' ? <Folder size={18} /> : <File size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {getExplorerNodeDisplayName(node)}
                              </span>
                              {node.type === 'file' && (
                                <ExplorerFormatBadge format={getExplorerActualFormat(node)} />
                              )}
                            </div>
                          </div>
                          {node.type === 'folder' && (
                            <ChevronRight
                              size={14}
                              className="text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-600">
                          {node.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center font-mono text-xs text-gray-500">
                        {new Date(node.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRenameNode(node)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                            title="Rename"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenMoveDialog(node)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                            title="Pindah"
                          >
                            <FolderInput size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteNode(node)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {moveDialog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">Pindah item</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Pilih folder tujuan untuk "{getExplorerNodeDisplayName(moveDialog.node)}".
                </p>
              </div>
              <div className="space-y-2 px-5 py-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Folder tujuan
                </label>
                <select
                  value={moveDialog.selectedParentId || 'root'}
                  onChange={(event) =>
                    setMoveDialog((current) =>
                      current
                        ? {
                            ...current,
                            selectedParentId:
                              event.target.value === 'root' ? null : event.target.value,
                          }
                        : current
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {moveDialog.targets.map((target) => (
                    <option key={target.id || 'root'} value={target.id || 'root'}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setMoveDialog(null)}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitMove}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Pindah
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,video/*,application/pdf,text/*"
        />
      </div>
    </>
  );
}
