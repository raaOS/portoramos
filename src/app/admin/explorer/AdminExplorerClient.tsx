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
    MoreVertical,
    FolderPlus,
    Upload,
    Check,
    Loader2,
    XCircle
} from 'lucide-react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { AnyExplorerNode } from '@/types/explorer';
import AdminButton from '@/app/admin/components/AdminButton';
import { m } from 'motion/react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';

export default function AdminExplorerClient() {
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [history, setHistory] = useState<(string | null)[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [nodes, setNodes] = useState<AnyExplorerNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [activeUploads, setActiveUploads] = useState<Record<string, {
        id: string;
        name: string;
        progress: number;
        status: 'uploading' | 'registering' | 'success' | 'error';
        error?: string;
    }>>({});
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { showError, showSuccess } = useToast();
    const { csrfToken } = useAdminAuth();

    // Fetch nodes
    const fetchNodes = useCallback(async (parentId: string | null) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/explorer?parentId=${parentId || ''}&_t=${Date.now()}`);
            const result = await res.json();
            if (result.success && result.data?.nodes) {
                setNodes(result.data.nodes);
            }
        } catch (error) {
            console.error('[AdminExplorer] Fetch error:', error);
            showError("Gagal mengambil data explorer");
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchNodes(currentParentId);
    }, [currentParentId, fetchNodes]);

    // Navigation logic
    const navigateTo = useCallback((id: string | null, addToHistory = true) => {
        if (addToHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(id);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        setCurrentParentId(id);
    }, [history, historyIndex]);

    const goBack = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCurrentParentId(history[newIndex]);
        }
    }, [history, historyIndex]);

    // CRUD Handlers
    const handleCreateFolder = async () => {
        const name = prompt("Nama Folder Baru:");
        if (!name) return;

        try {
            const token = getWritableCsrfToken(csrfToken);
            const res = await fetch('/api/explorer', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                body: JSON.stringify({
                    name,
                    type: 'folder',
                    parentId: currentParentId
                })
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
                showError("Gagal membuat folder");
            }
        } catch (err) {
            console.error(err);
            showError("Terjadi kesalahan sistem");
        }
    };

    const handleDeleteNode = async (node: AnyExplorerNode) => {
        if (!confirm(`Hapus ${node.type === 'folder' ? 'folder' : 'file'} "${node.name}"?`)) return;

        try {
            const token = getWritableCsrfToken(csrfToken);
            const res = await fetch(`/api/explorer?id=${node.id}`, {
                method: 'DELETE',
                headers: {
                    'x-csrf-token': token
                }
            });
            if (res.ok) {
                showSuccess("Berhasil dihapus");
                fetchNodes(currentParentId);
            } else {
                showError("Gagal menghapus");
            }
        } catch (err) {
            console.error(err);
            showError("Terjadi kesalahan sistem");
        }
    };

    const getFileKind = (mimeType: string): 'image' | 'video' | 'pdf' | 'text' => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'pdf';
        return 'text';
    };

    const handleUploadFile = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const filesArray = Array.from(files);
        // Reset input immediately so same file can be chosen again
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Mark overall uploading state
        setIsUploading(true);
        for (const file of filesArray) {
            const uploadId = Math.random().toString(36).substring(7);
            
            // Add to active uploads state for Optimistic UI
            setActiveUploads(prev => ({
                ...prev,
                [uploadId]: {
                    id: uploadId,
                    name: file.name,
                    progress: 0,
                    status: 'uploading'
                }
            }));

            const updateUpload = (updates: Partial<typeof activeUploads[string]>) => {
                setActiveUploads(prev => ({
                    ...prev,
                    [uploadId]: { ...prev[uploadId], ...updates }
                }));
            };

            try {
                // 1. Upload to Storage using XMLHttpRequest to track progress
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
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
                    
                    xhr.open('POST', `/api/upload`);
                    xhr.setRequestHeader('x-csrf-token', getWritableCsrfToken(csrfToken));
                    xhr.send(formData);
                });

                const uploadResult = await uploadPromise;
                
                // 2. Register in Explorer DB
                updateUpload({ status: 'registering', progress: 100 });
                
                const explorerRes = await fetch('/api/explorer', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-csrf-token': getWritableCsrfToken(csrfToken)
                    },
                    body: JSON.stringify({
                        type: 'file',
                        parentId: currentParentId || null, // Explicitly enforce null for Root
                        name: file.name,
                        url: uploadResult.url,
                        fileType: getFileKind(file.type),
                        size: file.size,
                        metadata: {
                            extension: file.name.split('.').pop()?.toLowerCase() || '',
                        }
                    })
                });

                if (explorerRes.ok) {
                    updateUpload({ status: 'success' });
                    // Refresh data
                    fetchNodes(currentParentId);
                    
                    // Cleanup success item after 3 seconds
                    setTimeout(() => {
                        setActiveUploads(prev => {
                            const next = { ...prev };
                            delete next[uploadId];
                            return next;
                        });
                    }, 3000);
                } else {
                    const errData = await explorerRes.json();
                    throw new Error(errData.error || 'Gagal mendaftarkan file');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.error(`[Upload Error ${uploadId}]:`, err);
                updateUpload({ status: 'error', error: message, progress: 0 });
                showError(`Gagal upload "${file.name}": ${message}`);
                
                // Keep error for 5 seconds to let user see it
                setTimeout(() => {
                    setActiveUploads(prev => {
                        const next = { ...prev };
                        delete next[uploadId];
                        return next;
                    });
                }, 5000);
            }
        }
        
        setIsUploading(false);
    };

    // Filtered nodes
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => 
            node.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [nodes, searchQuery]);

    const toolbarActions = (
        <div className="flex items-center gap-2">
            <AdminButton 
                variant="primary" 
                icon={<FolderPlus size={16} />} 
                onClick={handleCreateFolder}
            >
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
            <AdminButton 
                variant="ghost" 
                onClick={() => fetchNodes(currentParentId)}
            >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </AdminButton>
        </div>
    );

    return (
        <AdminLayout 
            title="Explorer Manager" 
            subtitle="Kelola struktur folder dan file untuk My Project di Desktop."
            actions={toolbarActions}
        >
            <div className="space-y-4">
                {/* Search & Breadcrumbs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500 overflow-hidden">
                        <button 
                            onClick={goBack} 
                            disabled={historyIndex <= 0}
                            className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            onClick={() => navigateTo(null)}
                            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors shrink-0"
                        >
                            <Home size={14} /> Root
                        </button>
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="font-medium text-gray-900 truncate">
                            {currentParentId ? (nodes.find(n => n.id === currentParentId)?.name || 'Folder') : 'Root'}
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Cari folder atau file..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all w-full sm:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Date Created</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Optimistic Upload Rows */}
                            {Object.values(activeUploads).map((upload) => (
                                <tr key={upload.id} className="bg-blue-50/20 border-l-2 border-l-blue-500 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-2 max-w-xs">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${upload.status === 'success' ? 'bg-green-100 text-green-600' : upload.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {upload.status === 'success' ? <Check size={18} /> : 
                                                     upload.status === 'error' ? <XCircle size={18} /> :
                                                     <File size={18} className="animate-pulse" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold text-gray-900 truncate">{upload.name}</span>
                                                    <span className={`text-[10px] ${upload.status === 'error' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                                        {upload.status === 'uploading' ? `Uploading... ${upload.progress}%` : 
                                                         upload.status === 'registering' ? 'Mendaftarkan file...' :
                                                         upload.status === 'success' ? 'Selesai!' : upload.error}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Progress Bar Container */}
                                            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <m.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ 
                                                        width: `${upload.progress}%`
                                                    }}
                                                    style={{
                                                        backgroundColor: upload.status === 'success' ? '#10b981' : 
                                                                        upload.status === 'error' ? '#ef4444' : '#3b82f6'
                                                    }}
                                                    className="h-full transition-all duration-300 ease-out"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-700">
                                            {upload.status === 'uploading' && <Loader2 size={10} className="animate-spin" />}
                                            {upload.status === 'success' ? 'COMPLETE' : 'PENDING'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500 font-mono italic">
                                        uploading...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end">
                                            {upload.status === 'uploading' ? (
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
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                            <span className="text-sm text-gray-500">Memuat data...</span>
                                        </div>
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
                                filteredNodes.map(node => (
                                    <tr key={node.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer group-hover:text-blue-600 transition-colors"
                                                onClick={() => node.type === 'folder' && navigateTo(node.id)}
                                            >
                                                <div className={`p-2 rounded-lg ${node.type === 'folder' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'}`}>
                                                    {node.type === 'folder' ? <Folder size={18} /> : <File size={18} />}
                                                </div>
                                                <span className="text-sm font-medium">{node.name}</span>
                                                {node.type === 'folder' && <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-600">
                                                {node.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500 font-mono">
                                            {new Date(node.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDeleteNode(node)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                    title="Settings"
                                                >
                                                    <MoreVertical size={16} />
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
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple
                accept="image/*,video/*,application/pdf,text/*"
            />
        </AdminLayout>
    );
}
