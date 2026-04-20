"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    Grid, 
    List, 
    RefreshCw, 
    Folder as FolderIcon,
    File as FileIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    Home,
    MonitorPlay,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import type { AnyExplorerNode, ExplorerFolder, ExplorerFile, FileKind } from "@/types/explorer";
import MacFolder from "./MacFolder";
import QuickLookModal from "@/components/ui/QuickLookModal";

interface ExplorerWindowProps {
    initialParentId?: string | null;
    isAdmin?: boolean;
    onOpenFile?: (file: ExplorerFile) => void;
}

export default function ExplorerWindow({ 
    initialParentId = null, 
    isAdmin: _isAdmin = false,
    onOpenFile 
}: ExplorerWindowProps) {
    // Single atomic state for the entire explorer view
    const [state, setState] = useState<{
        history: (string | null)[];
        historyIndex: number;
        displayedParentId: string | null;
        nodes: AnyExplorerNode[];
        pathNodes: ExplorerFolder[];
        isLoading: boolean;
    }>({
        history: [initialParentId],
        historyIndex: 0,
        displayedParentId: initialParentId,
        nodes: [],
        pathNodes: [],
        isLoading: true
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [previewNode, setPreviewNode] = useState<ExplorerFile | null>(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isNavigatingRef = useRef(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Animation Variants
    // Keep folder transitions smooth and avoid "pop" on back navigation.
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 6 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.12 }
        }
    };

    const { history, historyIndex, displayedParentId, nodes, pathNodes, isLoading } = state;
    const currentParentId = useMemo(() => history[historyIndex] ?? null, [history, historyIndex]);

    const fetchNodes = useCallback(async (parentId: string | null) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const effectiveId = parentId || 'root';
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const res = await fetch(`/api/explorer?parentId=${effectiveId}&path=true&_t=${Date.now()}`, {
                signal: controller.signal
            });
            const result = await res.json();
            
            if (result.success && !controller.signal.aborted) {
                setHasLoadedOnce(true);
                setState(prev => ({
                    ...prev,
                    displayedParentId: parentId ?? null,
                    nodes: result.data?.nodes || [],
                    pathNodes: result.data?.path || [],
                    isLoading: false
                }));
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('[Explorer] Fetch failed:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    // Reset scroll only when the displayed folder actually changes.
    // This prevents a "jump" during loading (especially noticeable on Back to Root).
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [displayedParentId]);


    // Effect to handle data fetching based on currentParentId
    useEffect(() => {
        // Defer to avoid cascading-render lint (setState inside effect body).
        const t = window.setTimeout(() => {
            fetchNodes(currentParentId);
        }, 0);
        return () => {
            window.clearTimeout(t);
            abortControllerRef.current?.abort();
        };
    }, [currentParentId, fetchNodes]);

    // Navigation actions
    const navigateTo = useCallback((id: string | null, addToHistory = true) => {
        const currentParentId = history[historyIndex] ?? null;
        if (isNavigatingRef.current || currentParentId === id) return;

        if (addToHistory) {
            isNavigatingRef.current = true;
            setSelectedNodeId(null);
            setState(prev => {
                const newHistory = prev.history.slice(0, prev.historyIndex + 1);
                newHistory.push(id);
                return {
                    ...prev,
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                    // Note: We no longer clear nodes/pathNodes here to prevent skeleton flicker
                    isLoading: true
                };
            });
            setTimeout(() => { isNavigatingRef.current = false; }, 300);
        }
    }, [history, historyIndex]);

    const goBack = useCallback(() => {
        if (isNavigatingRef.current || historyIndex <= 0) return;

        isNavigatingRef.current = true;
        setSelectedNodeId(null);
        setState(prev => ({ 
            ...prev, 
            historyIndex: prev.historyIndex - 1,
            isLoading: true 
        }));
        setTimeout(() => { isNavigatingRef.current = false; }, 300);
    }, [historyIndex]);

    const goForward = useCallback(() => {
        if (isNavigatingRef.current || historyIndex >= history.length - 1) return;

        isNavigatingRef.current = true;
        setSelectedNodeId(null);
        setState(prev => ({ 
            ...prev, 
            historyIndex: prev.historyIndex + 1,
            isLoading: true 
        }));
        setTimeout(() => { isNavigatingRef.current = false; }, 300);
    }, [historyIndex, history.length]);


    // Derived filtered nodes
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
        if (idx < fileNodes.length - 1) {
            const nextNode = fileNodes[idx + 1];
            setPreviewNode(nextNode);
            setSelectedNodeId(nextNode.id);
        }
    }, [previewNode, fileNodes]);

    const handlePrevPreview = useCallback(() => {
        if (!previewNode) return;
        const idx = fileNodes.findIndex(n => n.id === previewNode.id);
        if (idx > 0) {
            const prevNode = fileNodes[idx - 1];
            setPreviewNode(prevNode);
            setSelectedNodeId(prevNode.id);
        }
    }, [previewNode, fileNodes]);

    const handleNodeClick = (node: AnyExplorerNode, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
    };

    const handleNodeDoubleClick = useCallback((node: AnyExplorerNode, e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (node.type === 'folder') {
            navigateTo(node.id);
        } else if (node.type === 'file') {
            setPreviewNode(node);
            onOpenFile?.(node);
        }
    }, [navigateTo, onOpenFile]);

    const previewType: FileKind = previewNode?.fileType || 'image';

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Space to preview
            if (e.code === 'Space' && selectedNodeId && !previewNode) {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (node && node.type === 'file') {
                    e.preventDefault();
                    setPreviewNode(node as ExplorerFile);
                }
            }

            // Enter to open/navigate
            if (e.key === 'Enter' && selectedNodeId) {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (node) {
                    e.preventDefault();
                    handleNodeDoubleClick(node);
                }
            }

            // Arrow keys navigation
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !previewNode) {
                e.preventDefault();
                const currentIndex = filteredNodes.findIndex(n => n.id === selectedNodeId);
                let nextIndex = currentIndex;

                if (currentIndex === -1) {
                    nextIndex = 0;
                } else {
                    if (e.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
                    if (e.key === 'ArrowRight') nextIndex = Math.min(filteredNodes.length - 1, currentIndex + 1);
                    
                    if (viewMode === 'grid' && contentRef.current) {
                        const columns = Math.floor(contentRef.current.clientWidth / 120) || 1;
                        if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - columns);
                        if (e.key === 'ArrowDown') nextIndex = Math.min(filteredNodes.length - 1, currentIndex + columns);
                    } else if (viewMode === 'list') {
                        if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
                        if (e.key === 'ArrowDown') nextIndex = Math.min(filteredNodes.length - 1, currentIndex + 1);
                    }
                }
                
                const nextNode = filteredNodes[nextIndex];
                if (nextNode) setSelectedNodeId(nextNode.id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, nodes, previewNode, handleNodeDoubleClick, filteredNodes, viewMode]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

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
                            className="p-1.5 rounded-full disabled:opacity-20 transition-all text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 hover:text-black dark:hover:text-white"
                            title="Back"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            disabled={historyIndex >= history.length - 1}
                            onClick={goForward}
                            className="p-1.5 rounded-full disabled:opacity-20 transition-all text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 hover:text-black dark:hover:text-white"
                            title="Forward"
                        >
                            <ChevronRight size={20} />
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
                        {pathNodes.map((node) => (
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
                        className={`p-1.5 rounded transition-all text-gray-400 hover:text-black dark:hover:text-white active:scale-90 ${isLoading ? 'animate-spin' : ''}`}
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
                            className="pl-8 pr-3 py-1 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-md text-xs outline-none w-32 focus:w-48 transition-all"
                        />
                    </div>

                    {/* View Modes */}
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className="p-1 rounded transition-colors"
                            title="Grid View"
                        >
                            <Grid size={14} className={viewMode === 'grid' ? 'text-black dark:text-white' : 'text-gray-400'} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className="p-1 rounded transition-colors"
                            title="List View"
                        >
                            <List size={14} className={viewMode === 'list' ? 'text-black dark:text-white' : 'text-gray-400'} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div 
                ref={contentRef}
                onClick={() => setSelectedNodeId(null)}
                className="flex-1 overflow-y-auto p-6 scroll-smooth about-scrollbar overscroll-contain relative"
            >
                {/* Global Fetch Progress Spinner (Very Subtle) */}
                <AnimatePresence>
                    {isLoading && (
                        <m.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full shadow-sm border border-black/5 dark:border-white/10 z-[20] flex items-center gap-2 pointer-events-none"
                        >
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Loading</span>
                            <RefreshCw size={10} className="animate-spin text-gray-500 dark:text-gray-400" />
                        </m.div>
                    )}
                </AnimatePresence>

                <div className="h-full">
                    {/* Skeleton only for first-ever load; avoid flicker on Back to Root */}
                    {!hasLoadedOnce && isLoading && nodes.length === 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-y-10 gap-x-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                                    <div className="w-16 h-20 bg-black/5 dark:bg-white/5 rounded-lg" />
                                    <div className="h-2 w-12 bg-black/5 dark:bg-white/5 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : filteredNodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center">
                                <Search size={32} strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-medium">No files found</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait" initial={false}>
                            {viewMode === 'grid' ? (
                                <m.div 
                                    key={`grid:${displayedParentId ?? 'root'}`}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-y-10 gap-x-4"
                                >
                                    {filteredNodes.map(node => (
                                        <m.div
                                            key={node.id}
                                            variants={itemVariants}
                                            layout
                                            className={`flex flex-col items-center group cursor-pointer relative ${
                                                selectedNodeId === node.id ? 'z-10' : 'z-0'
                                            }`}
                                            onClick={(e) => handleNodeClick(node, e)}
                                            onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                                        >
                                            <div className="relative mb-2 pointer-events-none">
                                                <AnimatePresence>
                                                    {selectedNodeId === node.id && (
                                                        <m.div 
                                                            layoutId="selection-grid"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            className="absolute -inset-4 bg-black/10 dark:bg-white/10 rounded-xl border border-black/5 dark:border-white/5"
                                                        />
                                                    )}
                                                </AnimatePresence>
                                                
                                                <div className="relative">
                                                    {node.type === 'folder' ? (
                                                        <MacFolder size={0.9} isStatic={true} label="" />
                                                    ) : (
                                                        <FileThumbnail file={node as ExplorerFile} />
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded text-center truncate max-w-full transition-colors ${
                                                selectedNodeId === node.id 
                                                    ? 'bg-black/70 dark:bg-white/20 text-white shadow-md' 
                                                    : 'text-slate-700 dark:text-slate-300 group-hover:bg-black/5 dark:group-hover:bg-white/10'
                                            }`}>
                                                {node.name}
                                            </span>
                                        </m.div>
                                    ))}
                                </m.div>
                            ) : (
                                <m.div 
                                    key={`list:${displayedParentId ?? 'root'}`}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="flex flex-col min-w-full"
                                >
                                    {/* List Header */}
                                    <div className="flex border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-20">
                                        <div className="w-1/2 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-10">Name</div>
                                        <div className="w-1/4 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-black/5 dark:border-white/5 pr-4">Date</div>
                                        <div className="w-1/4 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-black/5 dark:border-white/5 text-right pr-4">Size</div>
                                    </div>
                                    
                                    {filteredNodes.map(node => (
                                        <m.div
                                            key={node.id}
                                            variants={itemVariants}
                                            layout
                                            className={`flex group cursor-pointer border-b border-black/5 dark:border-white/5 relative ${
                                                selectedNodeId === node.id ? 'z-10 bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
                                            }`}
                                            onClick={(e) => handleNodeClick(node, e)}
                                            onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                                        >
                                            {selectedNodeId === node.id && (
                                                <m.div 
                                                    layoutId="selection-bar"
                                                    className="absolute left-0 top-0 bottom-0 w-1 bg-gray-500 dark:bg-gray-400"
                                                />
                                            )}
                                            
                                            <div className="w-1/2 p-2 flex items-center gap-3 pl-4">
                                                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                    {node.type === 'folder' ? (
                                                        <FolderIcon size={16} className="text-gray-400 dark:text-gray-500" />
                                                    ) : (
                                                        <FileThumbnail file={node as ExplorerFile} size="xs" />
                                                    )}
                                                </div>
                                                <span className={`text-[12px] truncate ${selectedNodeId === node.id ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {node.name}
                                                </span>
                                            </div>
                                            <div className="w-1/4 p-2 text-[11px] text-slate-500 flex items-center border-l border-black/5 dark:border-white/5">
                                                {formatDate(node.updatedAt)}
                                            </div>
                                            <div className="w-1/4 p-2 text-[11px] text-slate-500 text-right flex items-center justify-end pr-4 border-l border-black/5 dark:border-white/5">
                                                {node.type === 'folder' ? '--' : formatSize(node.size || 0)}
                                            </div>
                                        </m.div>
                                    ))}
                                </m.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Quick Look Preview Portal */}
                <QuickLookModal 
                    isOpen={!!previewNode}
                    onClose={() => setPreviewNode(null)}
                    title={previewNode?.name || ''}
                    type={previewType}
                    url={previewNode?.url || ''}
                    metadata={previewNode ? `${previewNode?.metadata?.extension?.toUpperCase() || ''} • ${formatSize(previewNode?.size || 0)}` : ''}
                    hasNext={previewNode ? fileNodes.findIndex(n => n.id === previewNode?.id) < fileNodes.length - 1 : false}
                    hasPrev={previewNode ? fileNodes.findIndex(n => n.id === previewNode?.id) > 0 : false}
                    onNext={handleNextPreview}
                    onPrev={handlePrevPreview}
                />
            </div>

            
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

function FileThumbnail({ file, size = 'md' }: { file: ExplorerFile, size?: 'xs' | 'sm' | 'md' | 'lg' }) {
    const [hasError, setHasError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Determine the source to use for the preview
    const src = file.thumbnailUrl || file.url;
    const isVideo = file.fileType === 'video';
    const isImage = file.fileType === 'image';

    const sizeClasses = {
        xs: 'w-5 h-5 rounded-sm',
        sm: 'w-10 h-10 rounded-md',
        md: 'w-16 h-20 rounded-lg',
        lg: 'w-24 h-32 rounded-xl'
    };

    return (
        <div 
            className={`${sizeClasses[size]} bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/10 flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-shadow`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {(!src || hasError) ? (
                <div className="flex flex-col items-center gap-1">
                    {isVideo ? <VideoIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" /> : 
                     isImage ? <ImageIcon size={size === 'xs' ? 12 : 24} className="text-green-500 opacity-60" /> : 
                     <FileIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" />}
                </div>
            ) : isVideo ? (
                <m.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative"
                >
                    <video 
                        src={src} 
                        className="w-full h-full object-cover" 
                        muted
                        playsInline
                    />
                    {size !== 'xs' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MonitorPlay size={size === 'sm' ? 14 : 20} className="text-white drop-shadow-md" />
                        </div>
                    )}
                </m.div>
            ) : (
                <m.img 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={src} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={() => setHasError(true)}
                    loading="lazy"
                />
            )}
            
            {/* Type Badge (Only for larger sizes) */}
            {size !== 'xs' && (
                <div className={`absolute bottom-0 inset-x-0 h-4 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
                    <span className="text-[7px] font-black text-white uppercase tracking-tighter">
                        {file.metadata?.extension || file.fileType}
                    </span>
                </div>
            )}
        </div>
    );
}
