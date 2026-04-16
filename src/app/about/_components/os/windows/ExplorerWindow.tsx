"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    MoreVertical, 
    Grid, 
    List, 
    RefreshCw, 
    Plus,
    Folder as FolderIcon,
    File as FileIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    Home,
    MonitorPlay
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import type { AnyExplorerNode, ExplorerFolder, ExplorerFile, NodeType } from "@/types/explorer";
import MacFolder from "./MacFolder";
import QuickLookModal from "@/components/ui/QuickLookModal";
import { useToast } from "@/contexts/ToastContext";

interface ExplorerWindowProps {
    initialParentId?: string | null;
    isAdmin?: boolean;
    onOpenFile?: (file: ExplorerFile) => void;
}

export default function ExplorerWindow({ 
    initialParentId = null, 
    isAdmin = false,
    onOpenFile 
}: ExplorerWindowProps) {
    const [currentParentId, setCurrentParentId] = useState<string | null>(initialParentId);
    const [history, setHistory] = useState<(string | null)[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [nodes, setNodes] = useState<AnyExplorerNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [pathNodes, setPathNodes] = useState<ExplorerFolder[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [previewNode, setPreviewNode] = useState<ExplorerFile | null>(null);
    const { showInfo } = useToast();

    // Fetch nodes for current folder
    const fetchNodes = useCallback(async (parentId: string | null) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/explorer?parentId=${parentId || ''}&_t=${Date.now()}`);
            const result = await res.json();
            if (result.success && result.data?.nodes) {
                setNodes(result.data.nodes);
            }
        } catch (error) {
            console.error('[Explorer] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch path for breadcrumbs (simplified: in a real app, this would be a recursive lookup or stored in path)
    const fetchPath = useCallback(async (id: string | null) => {
        if (!id) {
            setPathNodes([]);
            return;
        }
        // Simplified path fetching for now - just the current folder
        // In reality, we'd want the full lineage
    }, []);

    useEffect(() => {
        fetchNodes(currentParentId);
        fetchPath(currentParentId);
    }, [currentParentId, fetchNodes, fetchPath]);

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

    const goForward = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setCurrentParentId(history[newIndex]);
        }
    }, [history, historyIndex]);

    // Filtered nodes
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => 
            node.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [nodes, searchQuery]);

    // Gallery navigation
    const fileNodes = useMemo(() => filteredNodes.filter(n => n.type === 'file') as ExplorerFile[], [filteredNodes]);
    
    const handleNextPreview = useCallback(() => {
        if (!previewNode) return;
        const idx = fileNodes.findIndex(n => n.id === previewNode.id);
        if (idx < fileNodes.length - 1) setPreviewNode(fileNodes[idx + 1]);
    }, [previewNode, fileNodes]);

    const handlePrevPreview = useCallback(() => {
        if (!previewNode) return;
        const idx = fileNodes.findIndex(n => n.id === previewNode.id);
        if (idx > 0) setPreviewNode(fileNodes[idx - 1]);
    }, [previewNode, fileNodes]);

    const handleNodeClick = (node: AnyExplorerNode) => {
        setSelectedNodeId(node.id);
        if (node.type === 'folder') {
            // Single click selects, double click is handled by DoubleClick event
        }
    };

    const handleNodeDoubleClick = (node: AnyExplorerNode) => {
        if (node.type === 'folder') {
            navigateTo(node.id);
        } else if (node.type === 'file') {
            setPreviewNode(node as ExplorerFile);
            if (onOpenFile) onOpenFile(node as ExplorerFile);
        }
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && selectedNodeId && !previewNode) {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (node && node.type === 'file') {
                    e.preventDefault();
                    setPreviewNode(node as ExplorerFile);
                }
            }
            if (e.key === 'Enter' && selectedNodeId) {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (node) {
                    e.preventDefault();
                    handleNodeDoubleClick(node);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, nodes, previewNode]);

    return (
        <div className="flex flex-col h-full bg-[#f6f6f6] dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 font-sans">
            {/* Toolbar */}
            <div className="h-10 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        <button 
                            disabled={historyIndex <= 0}
                            onClick={goBack}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            disabled={historyIndex >= history.length - 1}
                            onClick={goForward}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex items-center text-xs font-medium text-gray-500 overflow-hidden max-w-md">
                        <button 
                            onClick={() => navigateTo(null)}
                            className="hover:text-black dark:hover:text-white flex items-center gap-1 shrink-0"
                        >
                            <Home size={14} /> Root
                        </button>
                        {pathNodes.map((node, i) => (
                            <React.Fragment key={node.id}>
                                <span className="mx-1 opacity-50">/</span>
                                <button 
                                    onClick={() => navigateTo(node.id)}
                                    className="hover:text-black dark:hover:text-white truncate"
                                >
                                    {node.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Refresh Button */}
                    <button 
                        onClick={() => fetchNodes(currentParentId)}
                        disabled={isLoading}
                        className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
                        title="Refresh folder content"
                    >
                        <RefreshCw size={16} />
                    </button>

                    {/* Search */}
                    <div className="relative group hidden sm:block">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1 bg-black/5 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-md text-xs outline-none w-32 focus:w-48 transition-all"
                        />
                    </div>

                    {/* View Modes */}
                    <div className="flex bg-black/5 dark:bg-white/5 rounded-md p-0.5">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm' : ''}`}
                        >
                            <Grid size={14} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow-sm' : ''}`}
                        >
                            <List size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth about-scrollbar overscroll-contain">
                {isLoading ? (
                    <div className="flex flex-wrap gap-8 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-24 h-32 bg-black/5 dark:bg-white/5 rounded-lg" />
                        ))}
                    </div>
                ) : filteredNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <FolderIcon size={40} strokeWidth={1} />
                        </div>
                        <p className="text-sm font-medium">This folder is empty</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-y-10 gap-x-4">
                        {filteredNodes.map(node => (
                            <m.div
                                key={node.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5 }}
                                className={`flex flex-col items-center group cursor-pointer p-2 rounded-lg transition-colors ${selectedNodeId === node.id ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/30' : ''}`}
                                onClick={() => handleNodeClick(node)}
                                onDoubleClick={() => handleNodeDoubleClick(node)}
                            >
                                <div className="relative mb-2">
                                    {node.type === 'folder' ? (
                                        <MacFolder size={0.9} isStatic={true} label="" />
                                    ) : (
                                        <FileThumbnail file={node as ExplorerFile} />
                                    )}
                                </div>
                                <span className={`text-[11px] font-medium text-center line-clamp-2 px-1 rounded-sm transition-colors max-w-full break-words ${selectedNodeId === node.id ? 'bg-blue-500 text-white' : 'group-hover:bg-black/5'}`}>
                                    {node.name}
                                </span>
                            </m.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 w-full max-w-4xl mx-auto">
                        {/* List Header */}
                        <div className="flex items-center px-4 py-2 border-b border-black/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <div className="flex-1">Name</div>
                            <div className="w-32 text-center">Date</div>
                            <div className="w-24 text-right">Size</div>
                        </div>
                        {filteredNodes.map(node => (
                            <div
                                key={node.id}
                                onClick={() => handleNodeClick(node)}
                                onDoubleClick={() => handleNodeDoubleClick(node)}
                                className={`flex items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer transition-colors group ${selectedNodeId === node.id ? 'bg-blue-500/10 dark:bg-blue-500/20' : ''}`}
                            >
                                <div className="flex-1 flex items-center gap-3">
                                    {node.type === 'folder' ? <FolderIcon size={16} className="text-blue-500" /> : <FileIcon size={16} className="text-gray-400" />}
                                    <span className="text-xs font-medium truncate">{node.name}</span>
                                </div>
                                <div className="w-32 text-center text-[10px] text-gray-500">
                                    {new Date(node.createdAt).toLocaleDateString()}
                                </div>
                                <div className="w-24 text-right text-[10px] text-gray-500">
                                    {node.type === 'file' ? `${Math.round(((node as ExplorerFile).size || 0) / 1024)} KB` : '--'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            
            {/* Quick Look Preview Portal */}
            <QuickLookModal 
                isOpen={!!previewNode}
                onClose={() => setPreviewNode(null)}
                title={previewNode?.name || ''}
                type={previewNode?.fileType as any || 'image'}
                url={previewNode?.url || ''}
                metadata={previewNode ? `${previewNode.metadata?.extension?.toUpperCase() || ''} • ${Math.round((previewNode.size || 0) / 1024)} KB` : ''}
                hasNext={previewNode ? fileNodes.findIndex(n => n.id === previewNode.id) < fileNodes.length - 1 : false}
                hasPrev={previewNode ? fileNodes.findIndex(n => n.id === previewNode.id) > 0 : false}
                onNext={handleNextPreview}
                onPrev={handlePrevPreview}
            />
            
            <style jsx>{`
                .about-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .about-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .about-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 4px;
                }
                .about-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0,0,0,0.2);
                }
                :global(.dark) .about-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255,255,255,0.1);
                }
                :global(.dark) .about-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
}

function FileThumbnail({ file }: { file: ExplorerFile }) {
    const [hasError, setHasError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Determine the source to use for the preview
    const src = file.thumbnailUrl || file.url;
    const isVideo = file.fileType === 'video';
    const isImage = file.fileType === 'image';

    return (
        <div 
            className="w-16 h-20 bg-white dark:bg-white/10 rounded-lg shadow-sm border border-black/5 dark:border-white/10 flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-shadow"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {(!src || hasError) ? (
                <div className="flex flex-col items-center gap-1">
                    {isVideo ? <VideoIcon size={24} className="text-blue-500 opacity-60" /> : 
                     isImage ? <ImageIcon size={24} className="text-green-500 opacity-60" /> : 
                     <FileIcon size={24} className="text-gray-400 opacity-60" />}
                </div>
            ) : isVideo ? (
                <div className="w-full h-full relative">
                    {/* For videos, we use a simple video tag if possible, or fallback to icon */}
                    <video 
                        src={src} 
                        className="w-full h-full object-cover" 
                        onLoadedData={(e) => {
                            // Try to seek to 1s to trigger a frame capture by browser
                            (e.target as HTMLVideoElement).currentTime = 1;
                        }}
                        onError={() => setHasError(true)}
                        muted
                        playsInline
                    />
                    {/* Play Overlay Icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MonitorPlay size={20} className="text-white drop-shadow-md" />
                    </div>
                </div>
            ) : (
                <img 
                    src={src} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={() => setHasError(true)}
                    loading="lazy"
                />
            )}
            
            {/* Type Badge */}
            <div className={`absolute bottom-0 inset-x-0 h-4 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
                <span className="text-[7px] font-black text-white uppercase tracking-tighter">
                    {file.metadata?.extension || file.fileType}
                </span>
            </div>
        </div>
    );
}
