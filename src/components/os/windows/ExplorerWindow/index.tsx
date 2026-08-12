'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search, Grid, RefreshCw, Home } from 'lucide-react';
import { m, AnimatePresence, type Variants } from 'motion/react';
import { ExplorerFormatBadge } from '@/components/ui/ExplorerFormatBadge';
import type { AnyExplorerNode, ExplorerFolder, ExplorerFile } from '@/types/explorer';
import {
  getExplorerActualFormat,
  getExplorerFileDisplayName,
  getExplorerNodeDisplayName,
} from '@/lib/utils/explorerName';
import MacFolder from '../MacFolder';
import { useDesktopWindowContext } from '../../context/DesktopWindowContext';
import InlineFilePreview from './InlineFilePreview';
import FileThumbnail from './FileThumbnail';

interface ExplorerWindowProps {
  initialParentId?: string | null;
  isAdmin?: boolean;
  onOpenFile?: (file: ExplorerFile) => void;
}

export default function ExplorerWindow({
  initialParentId = null,
  isAdmin: _isAdmin,
  onOpenFile,
}: ExplorerWindowProps) {
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
    isLoading: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<ExplorerFile | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNavigatingRef = useRef(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { setWindows, windows } = useDesktopWindowContext();
  const explorerWindow = windows.find((w) => w.id === 'explorer');
  const isMaximized = explorerWindow?.isMaximized || false;

  useEffect(() => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === 'explorer') {
          return {
            ...w,
            width: 900,
            height: 600,
          };
        }
        return w;
      })
    );
  }, [setWindows]);

  // Animation Variants
  const openEase = [0.16, 1, 0.3, 1] as const;
  const openTransition = { duration: 0.25, ease: openEase };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: openTransition,
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 10,
      transition: { duration: 0.16, ease: openEase },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: openEase },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.12 },
    },
  };

  const { history, historyIndex, displayedParentId, nodes, pathNodes, isLoading } = state;
  const currentParentId = useMemo(() => history[historyIndex] ?? null, [history, historyIndex]);

  const fetchNodes = useCallback(async (parentId: string | null) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const effectiveId = parentId || 'root';
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch(`/api/explorer?parentId=${effectiveId}&path=true&_t=${Date.now()}`, {
        signal: controller.signal,
      });
      const result = await res.json();

      if (result.success && !controller.signal.aborted) {
        setHasLoadedOnce(true);
        setState((prev) => ({
          ...prev,
          displayedParentId: parentId ?? null,
          nodes: result.data?.nodes || [],
          pathNodes: result.data?.path || [],
          isLoading: false,
        }));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('[Explorer] Fetch failed:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Reset scroll only when the displayed folder actually changes.
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [displayedParentId, activeFile?.id]);

  // Effect to handle data fetching based on currentParentId
  useEffect(() => {
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
    if (isNavigatingRef.current) return;

    setActiveFile(null);

    if (addToHistory) {
      isNavigatingRef.current = true;
      setSelectedNodeId(null);
      setState((prev) => {
        const currentPid = prev.history[prev.historyIndex] ?? null;
        if (currentPid === id) {
          isNavigatingRef.current = false;
          return prev;
        }
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(id);
        return {
          ...prev,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: true,
        };
      });
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);
    }
  }, []);

  const goBack = useCallback(() => {
    if (activeFile) {
      setActiveFile(null);
      return;
    }

    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    setSelectedNodeId(null);
    setState((prev) => {
      if (prev.historyIndex <= 0) {
        isNavigatingRef.current = false;
        return prev;
      }
      return {
        ...prev,
        historyIndex: prev.historyIndex - 1,
        isLoading: true,
      };
    });
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 300);
  }, [activeFile]);

  const goForward = useCallback(() => {
    if (activeFile) return;
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    setSelectedNodeId(null);
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) {
        isNavigatingRef.current = false;
        return prev;
      }
      return {
        ...prev,
        historyIndex: prev.historyIndex + 1,
        isLoading: true,
      };
    });
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 300);
  }, [activeFile]);

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  // Derived filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) =>
      getExplorerNodeDisplayName(node).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  const handleNodeClick = (node: AnyExplorerNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      void handleNodeDoubleClick(node, e);
    }
  };

  const handleNodeDoubleClick = useCallback(
    async (node: AnyExplorerNode, e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation();
      if (node.type === 'folder') {
        navigateTo(node.id);
      } else if (node.type === 'file') {
        setActiveFile(node);
        onOpenFile?.(node);
      }
    },
    [navigateTo, onOpenFile]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeFile) {
        e.preventDefault();
        setActiveFile(null);
        return;
      }

      if (e.code === 'Space' && selectedNodeId && !activeFile) {
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (node && node.type === 'file') {
          e.preventDefault();
          setActiveFile(node as ExplorerFile);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, activeFile]);

  return (
    <div className="flex h-full w-full flex-col select-none overflow-hidden bg-white/70 backdrop-blur-xl dark:bg-black/70">
      {/* Title Bar Navigation Header */}
      <div className="relative flex shrink-0 items-center justify-between border-b border-black/5 px-4 py-2.5 dark:border-white/10">
        <div className="flex items-center gap-2">
          {/* History back/forward buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={goBack}
              disabled={historyIndex <= 0 && !activeFile}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-black/5 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-white/5"
              title="Kembali"
              aria-label="Kembali"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goForward}
              disabled={historyIndex >= history.length - 1 || !!activeFile}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-black/5 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-white/5"
              title="Maju"
              aria-label="Maju"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 overflow-hidden text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => navigateTo(null)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-black/5 hover:text-blue-500 dark:hover:bg-white/5"
            >
              <Home size={13} className="text-slate-400" />
              <span>Root</span>
            </button>
            {pathNodes.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                <span className="text-slate-400">/</span>
                <button
                  onClick={() => navigateTo(folder.id)}
                  className={`rounded px-1.5 py-0.5 transition-colors hover:bg-black/5 hover:text-blue-500 dark:hover:bg-white/5 ${
                    idx === pathNodes.length - 1 && !activeFile
                      ? 'font-bold text-slate-900 dark:text-white'
                      : ''
                  }`}
                >
                  {getExplorerNodeDisplayName(folder)}
                </button>
              </React.Fragment>
            ))}
            {activeFile && (
              <>
                <span className="text-slate-400">/</span>
                <span className="truncate font-bold text-slate-900 dark:text-white">
                  {getExplorerFileDisplayName(activeFile)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Search and reload */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNodes(currentParentId)}
            disabled={isLoading || !!activeFile}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
            title="Muat Ulang"
            aria-label="Muat Ulang"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {!activeFile && (
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
                className="h-7 w-32 rounded-lg border border-black/5 bg-black/5 pl-7 pr-2.5 text-xs text-slate-800 outline-none transition-all focus:w-44 focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:bg-black"
              />
            </div>
          )}

          {!activeFile && (
            <div className="flex items-center gap-1">
              <div className="rounded p-1 opacity-100">
                <Grid size={14} className="text-black dark:text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={contentRef}
        onClick={() => setSelectedNodeId(null)}
        className="about-scrollbar relative flex-1 overflow-y-auto overscroll-contain scroll-smooth p-6"
      >
        <div className="h-full">
          <AnimatePresence mode="wait" initial={false}>
            {activeFile ? (
              <m.div
                key={`file:${activeFile.id}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="h-full"
              >
                <InlineFilePreview file={activeFile} />
              </m.div>
            ) : !hasLoadedOnce && isLoading && nodes.length === 0 ? null : filteredNodes.length ===
              0 ? (
              <m.div
                key="empty"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex h-full flex-col items-center justify-center gap-4 text-slate-400"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  <Search size={32} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {searchQuery ? 'Tidak ada file yang cocok' : 'Folder ini kosong'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {searchQuery
                      ? `Pencarian "${searchQuery}" tidak menemukan item.`
                      : 'Belum ada file atau subfolder di direktori ini.'}
                  </p>
                </div>
              </m.div>
            ) : (
              <m.div
                key={`grid:${currentParentId || 'root'}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 ${
                  isMaximized ? 'lg:grid-cols-6 xl:grid-cols-8' : 'lg:grid-cols-5'
                }`}
              >
                {filteredNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isFolder = node.type === 'folder';
                  const file = isFolder ? null : (node as ExplorerFile);
                  const displayName = isFolder
                    ? getExplorerNodeDisplayName(node)
                    : getExplorerFileDisplayName(file!);
                  const actualFormat = isFolder ? 'FOLDER' : getExplorerActualFormat(file!);

                  return (
                    <m.div
                      key={node.id}
                      variants={itemVariants}
                      onClick={(e) => handleNodeClick(node, e)}
                      onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                      className={`group relative flex flex-col items-center rounded-xl p-3 text-center transition-all ${
                        isSelected
                          ? 'bg-blue-500/10 ring-2 ring-blue-500/80 dark:bg-blue-500/20'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="relative mb-2 flex h-16 w-16 items-center justify-center">
                        {isFolder ? (
                          <MacFolder size={0.9} isStatic={true} />
                        ) : (
                          <FileThumbnail file={file!} />
                        )}
                        {!isFolder && (
                          <div className="absolute -bottom-1.5 -right-1.5">
                            <ExplorerFormatBadge
                              format={actualFormat}
                              className="bg-black/70 text-[9px] font-bold text-white shadow-sm backdrop-blur dark:bg-white/80 dark:text-black"
                            />
                          </div>
                        )}
                      </div>
                      <span className="w-full truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {displayName}
                      </span>
                    </m.div>
                  );
                })}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
