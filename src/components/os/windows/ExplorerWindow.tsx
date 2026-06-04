'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Grid,
  RefreshCw,
  File as FileIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Home,
  MonitorPlay,
  AlertTriangle,
  ExternalLink,
  CalendarDays,
  Images,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { m, AnimatePresence, type Variants } from 'motion/react';
import { ExplorerFormatBadge } from '@/components/ui/ExplorerFormatBadge';
import type { AnyExplorerNode, ExplorerFolder, ExplorerFile } from '@/types/explorer';
import type { ResolvedEventPage } from '@/types/event-page';
import { getVideoPosterSource, getVideoPreviewSource } from '@/lib/mediaPreview';
import {
  getExplorerActualFormat,
  getExplorerFileDisplayName,
  getExplorerNodeDisplayName,
} from '@/lib/utils/explorerName';
import MacFolder from './MacFolder';
import { useDesktopWindowContext } from '../context/DesktopWindowContext';
import type { GalleryItem } from '@/types/projects';
import Media from '@/components/shared/Media';
import { getProxiedUrl } from '@/lib/utils';

// Utility functions extracted to module scope to avoid re-creation per render
const _formatDate = (dateStr?: string) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const withVideoStartTime = (src?: string | null) => {
  if (!src) return '';

  try {
    const url = new URL(src, window.location.origin);
    if (!url.hash) url.hash = 't=0.1';
    return url.toString();
  } catch {
    return src.includes('#') ? src : `${src}#t=0.1`;
  }
};

const getVideoSources = (url: string) => {
  const primary = url;
  const preview = getVideoPreviewSource(url);
  return Array.from(new Set([primary, preview].filter(Boolean)));
};

interface ExplorerWindowProps {
  initialParentId?: string | null;
  isAdmin?: boolean;
  onOpenFile?: (file: ExplorerFile) => void;
}

export default function ExplorerWindow({
  initialParentId = null,
  onOpenFile,
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
    isLoading: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode] = useState<'grid'>('grid');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<ExplorerFile | null>(null);
  const [activeEventPage, setActiveEventPage] = useState<ResolvedEventPage | null>(null);
  const [eventPageLoadingId, setEventPageLoadingId] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNavigatingRef = useRef(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxItems, setLightboxItems] = useState<GalleryItem[]>([]);

  const { setWindows, maximizeWindow, windows } = useDesktopWindowContext();
  const explorerWindow = windows.find((w) => w.id === 'explorer');
  const isMaximized = explorerWindow?.isMaximized || false;

  useEffect(() => {
    if (activeEventPage) {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === 'explorer') {
            return {
              ...w,
              width: 480,
              height: 700,
            };
          }
          return w;
        })
      );
    } else {
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
    }
  }, [activeEventPage, setWindows]);

  // Animation Variants
  // Keep folder transitions smooth and avoid "pop" on back navigation.
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
  // This prevents a "jump" during loading (especially noticeable on Back to Root).
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [displayedParentId, activeFile?.id, activeEventPage?.id]);

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
    if (isNavigatingRef.current) return;

    setActiveFile(null);
    setActiveEventPage(null);

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
    if (activeEventPage) {
      setActiveEventPage(null);
      return;
    }

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
  }, [activeEventPage, activeFile]);

  const goForward = useCallback(() => {
    if (activeFile || activeEventPage) return;
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
  }, [activeFile, activeEventPage]);

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

  const openEventPageForFolder = useCallback(async (folderId: string) => {
    setEventPageLoadingId(folderId);
    try {
      const res = await fetch(
        `/api/event-pages?folderId=${encodeURIComponent(folderId)}&_t=${Date.now()}`,
        { cache: 'no-store' }
      );
      const result = await res.json();
      const page = result.success ? result.data?.page : null;

      if (res.ok && page) {
        setActiveFile(null);
        setActiveEventPage(page);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('[Explorer] Failed to open event page:', error);
      return false;
    } finally {
      setEventPageLoadingId(null);
    }
  }, []);

  const handleNodeClick = (node: AnyExplorerNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
  };

  const handleNodeDoubleClick = useCallback(
    async (node: AnyExplorerNode, e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation();
      if (node.type === 'folder') {
        const openedEventPage = await openEventPageForFolder(node.id);
        if (openedEventPage) return;
        navigateTo(node.id);
      } else if (node.type === 'file') {
        setActiveEventPage(null);
        setActiveFile(node);
        onOpenFile?.(node);
      }
    },
    [navigateTo, onOpenFile, openEventPageForFolder]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (activeFile || activeEventPage)) {
        e.preventDefault();
        setActiveFile(null);
        setActiveEventPage(null);
        return;
      }

      // Space to preview
      if (e.code === 'Space' && selectedNodeId && !activeFile) {
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (node && node.type === 'file') {
          e.preventDefault();
          setActiveFile(node as ExplorerFile);
        }
      }

      // Enter to open/navigate
      if (e.key === 'Enter' && selectedNodeId) {
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (node) {
          e.preventDefault();
          void handleNodeDoubleClick(node);
        }
      }

      // Arrow keys navigation
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !activeFile) {
        e.preventDefault();
        const currentIndex = filteredNodes.findIndex((n) => n.id === selectedNodeId);
        let nextIndex = currentIndex;

        if (currentIndex === -1) {
          nextIndex = 0;
        } else {
          if (e.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
          if (e.key === 'ArrowRight')
            nextIndex = Math.min(filteredNodes.length - 1, currentIndex + 1);

          if (viewMode === 'grid' && contentRef.current) {
            const columns = Math.floor(contentRef.current.clientWidth / 120) || 1;
            if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - columns);
            if (e.key === 'ArrowDown')
              nextIndex = Math.min(filteredNodes.length - 1, currentIndex + columns);
          }
        }

        const nextNode = filteredNodes[nextIndex];
        if (nextNode) setSelectedNodeId(nextNode.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeId,
    nodes,
    activeFile,
    activeEventPage,
    handleNodeDoubleClick,
    filteredNodes,
    viewMode,
  ]);

  return (
    <div className="relative flex h-full flex-col bg-[#f6f6f6] font-sans text-gray-800 dark:bg-[#1a1a1a] dark:text-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex h-10 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-black/80">
        <div className="flex items-center gap-4">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              disabled={historyIndex <= 0 && !activeFile && !activeEventPage}
              onClick={goBack}
              className="p-1.5 text-gray-500 transition-all hover:text-gray-700 active:scale-95 active:text-[#03AC0E] disabled:opacity-20 dark:hover:text-gray-300 dark:active:text-[#03AC0E]"
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              disabled={!!activeFile || historyIndex >= history.length - 1}
              onClick={goForward}
              className="p-1.5 text-gray-500 transition-all hover:text-gray-700 active:scale-95 active:text-[#03AC0E] disabled:opacity-20 dark:hover:text-gray-300 dark:active:text-[#03AC0E]"
              title="Forward"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex max-w-md items-center overflow-hidden text-xs font-medium text-gray-500">
            <button
              onClick={() => navigateTo(null)}
              className="flex shrink-0 items-center gap-1 hover:text-black dark:hover:text-white"
            >
              <Home size={14} /> Root
            </button>
            {pathNodes.map((node) => (
              <React.Fragment key={node.id}>
                <span className="mx-1 opacity-50">/</span>
                <button
                  onClick={() => navigateTo(node.id)}
                  className="truncate hover:text-black dark:hover:text-white"
                >
                  {node.name}
                </button>
              </React.Fragment>
            ))}
            {activeFile && (
              <>
                <span className="mx-1 opacity-50">/</span>
                <span className="truncate text-slate-900 dark:text-white">
                  {getExplorerFileDisplayName(activeFile)}
                </span>
              </>
            )}
            {activeEventPage && (
              <>
                <span className="mx-1 opacity-50">/</span>
                <span className="truncate text-slate-900 dark:text-white">
                  {activeEventPage.title}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchNodes(currentParentId)}
            disabled={isLoading || !!activeFile || !!activeEventPage}
            className={`flex items-center justify-center rounded p-1.5 text-gray-400 transition-all hover:text-black active:scale-90 dark:hover:text-white`}
            title="Refresh folder content"
          >
            <RefreshCw size={16} className={isLoading ? 'origin-center animate-spin' : ''} />
          </button>

          {/* Search */}
          {!activeFile && !activeEventPage && (
            <div className="group relative hidden sm:block">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 rounded-md border border-transparent bg-black/5 py-1 pl-8 pr-3 text-xs outline-none transition-all focus:w-48 focus:border-black/20 dark:bg-white/5 dark:focus:border-white/20"
              />
            </div>
          )}

          {/* View Modes */}
          {!activeFile && !activeEventPage && (
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
        {/* Global Fetch Progress Spinner (Very Subtle) */}
        <AnimatePresence>
          {(isLoading || eventPageLoadingId) && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-none absolute left-1/2 top-2 z-[20] flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/5 bg-white/90 px-3 py-1 shadow-sm dark:border-white/10 dark:bg-black/90"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {eventPageLoadingId ? 'Opening' : 'Loading'}
              </span>
              <RefreshCw
                size={12}
                className="origin-center animate-spin text-gray-500 dark:text-gray-400"
              />
            </m.div>
          )}
        </AnimatePresence>

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
            ) : activeEventPage ? (
              <m.div
                key={`event:${activeEventPage.id}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="h-full"
              >
                <EventLandingPage
                  page={activeEventPage}
                  onOpenLightbox={(items, index) => {
                    setLightboxItems(items);
                    setLightboxIndex(index);
                  }}
                />
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
                <p className="text-sm font-medium">No files found</p>
              </m.div>
            ) : (
              <m.div
                key={`grid:${displayedParentId ?? 'root'}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-4 gap-y-10"
              >
                {filteredNodes.map((node) => (
                  <m.div
                    key={node.id}
                    variants={itemVariants}
                    layout
                    className={`group relative flex cursor-pointer flex-col items-center ${
                      selectedNodeId === node.id ? 'z-10' : 'z-0'
                    }`}
                    onClick={(e) => handleNodeClick(node, e)}
                    onDoubleClick={(e) => void handleNodeDoubleClick(node, e)}
                  >
                    <div className="pointer-events-none relative mb-2 flex h-[98px] w-full items-end justify-center">
                      <div className="relative flex h-full items-end justify-center">
                        {node.type === 'folder' ? (
                          <MacFolder size={0.9} isStatic={true} label="" />
                        ) : (
                          <FileThumbnail file={node as ExplorerFile} />
                        )}
                      </div>
                    </div>
                    <div
                      className={`max-w-full rounded px-2 py-1 text-center transition-colors ${
                        selectedNodeId === node.id
                          ? 'bg-black/70 text-white shadow-md dark:bg-white/20'
                          : 'text-slate-700 group-hover:bg-black/5 dark:text-slate-300 dark:group-hover:bg-white/10'
                      }`}
                    >
                      <span className="block truncate text-[11px] font-medium">
                        {getExplorerNodeDisplayName(node)}
                      </span>
                      {node.type === 'file' && (
                        <ExplorerFormatBadge
                          format={getExplorerActualFormat(node)}
                          variant={selectedNodeId === node.id ? 'selected' : 'default'}
                          className={
                            selectedNodeId === node.id
                              ? 'mt-1 text-[9px]'
                              : 'mt-1 bg-black/5 text-[9px] text-slate-500 dark:bg-white/10 dark:text-slate-300'
                          }
                        />
                      )}
                    </div>
                  </m.div>
                ))}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        .about-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .about-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .about-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .about-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
        :global(.dark) .about-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
        }
        :global(.dark) .about-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {lightboxIndex !== null && (
        <WindowImagePreview
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          groupName={activeEventPage?.title}
          isWindowMaximized={isMaximized}
          onToggleWindowMaximize={() => maximizeWindow('explorer')}
        />
      )}
    </div>
  );
}

function EventLandingPage({
  page,
  onOpenLightbox,
}: {
  page: ResolvedEventPage;
  onOpenLightbox: (items: GalleryItem[], index: number) => void;
}) {
  const cover = page.coverFile;
  const heroColor = page.headerColor || '#0f172a';

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isCompact = containerWidth < 768;

  // Masonry: calculate based on local container width rather than viewport width
  const galleryWidth = isCompact ? containerWidth : (containerWidth * 5) / 12;
  const masonryColumns = useMasonryColumns(page.galleryFiles.length, galleryWidth);

  return (
    <article 
      ref={containerRef}
      className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#111]"
    >
      {/* ── Hero Header ── */}
      <section
        className="relative min-h-[300px] overflow-hidden text-white"
        style={!cover ? { backgroundColor: heroColor } : undefined}
      >
        {!cover && (
          <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 mix-blend-overlay" />
        )}
        {cover ? (
          <img
            src={cover.thumbnailUrl || cover.url}
            alt={cover.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            draggable={false}
            loading="eager"
            fetchPriority="high"
          />
        ) : null}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        />
        <div className="relative z-10 flex min-h-[300px] flex-col justify-end p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md">
              <CalendarDays size={10} />
              {_formatDate(page.updatedAt)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 drop-shadow-md">
            {page.title}
          </h1>

          {page.subtitle && (
            <p className="text-sm sm:text-base text-white/80 max-w-2xl font-light drop-shadow-sm">
              {page.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── Main Layout Grid ── */}
      <div className={`grid gap-8 p-6 sm:p-8 ${isCompact ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* Left Column: Storytelling & Sections */}
        <div className={isCompact ? 'col-span-1 space-y-8' : 'col-span-7 space-y-8'}>
          
          {/* Overview */}
          <div className="rounded-xl border border-black/5 bg-slate-50/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#03AC0E]">
              Overview
            </h3>
            <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {page.description}
            </p>
          </div>

          {/* Sections Storytelling */}
          {page.sections.length > 0 && (
            <div className="space-y-8 pt-4">
              {page.sections.map((section) => {
                const files = page.sectionFiles[section.id] || [];
                return (
                  <div 
                    key={section.id} 
                    className="border-l-2 border-[#03AC0E]/30 pl-4 py-1 transition-all hover:border-[#03AC0E]"
                  >
                    {section.title && (
                      <h4 className="mb-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {section.title}
                      </h4>
                    )}
                    {section.body && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {section.body}
                      </p>
                    )}
                    {files.length > 0 && (
                      <div className={`mt-4 grid gap-3 ${files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {files.map((file) => (
                          <button
                            key={file.id}
                            onClick={(e) => {
                              e.preventDefault();
                              const items = files.map((f) => ({
                                kind: f.fileType === 'video' ? ('video' as const) : ('image' as const),
                                src: f.url,
                                poster: f.thumbnailUrl || undefined,
                                alt: f.name,
                              }));
                              const idx = files.findIndex((f) => f.id === file.id);
                              onOpenLightbox(items, idx >= 0 ? idx : 0);
                            }}
                            className="group relative block w-full text-left overflow-hidden rounded-none border border-black/5 bg-slate-100 dark:border-white/5 dark:bg-white/[0.02]"
                          >
                            <img
                              src={file.thumbnailUrl || file.url}
                              alt={file.name}
                              className="block w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            <span className="pointer-events-none absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 text-[10px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <span className="truncate">{file.name}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Masonry Showcase Gallery */}
        <div className={isCompact ? 'col-span-1 space-y-6' : 'col-span-5 space-y-6'}>
          <div className="flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
            <Images size={16} className="text-[#03AC0E]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Gallery Showcase
            </h3>
          </div>

          {page.galleryFiles.length > 0 ? (
            <div className="flex items-start gap-3">
              {Array.from({ length: masonryColumns }).map((_, colIndex) => {
                const columnFiles = page.galleryFiles.filter(
                  (_, fileIndex) => fileIndex % masonryColumns === colIndex
                );
                return (
                  <div key={colIndex} className="flex flex-1 flex-col gap-3">
                    {columnFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={(e) => {
                          e.preventDefault();
                          const items = page.galleryFiles.map((f) => ({
                            kind: f.fileType === 'video' ? ('video' as const) : ('image' as const),
                            src: f.url,
                            poster: f.thumbnailUrl || undefined,
                            alt: f.name,
                          }));
                          const idx = page.galleryFiles.findIndex((f) => f.id === file.id);
                          onOpenLightbox(items, idx >= 0 ? idx : 0);
                        }}
                        className="group relative block w-full text-left overflow-hidden rounded-none border border-black/5 bg-slate-50 dark:border-white/5 dark:bg-white/[0.01]"
                      >
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.name}
                          className="block w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="truncate">{file.name}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/10 p-8 text-center text-xs text-slate-400 dark:border-white/10">
              No gallery images in this event page.
            </div>
          )}
        </div>
      </div>

    </article>
  );
}

/** Responsive masonry column count based on gallery size and screen size. */
function useMasonryColumns(fileCount: number, containerWidth: number) {
  if (containerWidth < 280 || fileCount <= 1) {
    return 1;
  }
  if (containerWidth < 480 || fileCount <= 2) {
    return 2;
  }
  if (containerWidth < 768) {
    return 3;
  }
  return 2; // Perfect count for span-5 container layout on desktop
}

function InlineFilePreview({ file }: { file: ExplorerFile }) {
  const displayName = getExplorerFileDisplayName(file);
  const actualFormat = getExplorerActualFormat(file);
  const dimensions =
    file.metadata?.width && file.metadata?.height
      ? `${file.metadata.width} x ${file.metadata.height}`
      : null;
  const details = [actualFormat, formatSize(file.size || 0), dimensions].filter(Boolean).join(' / ');

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <div className="mb-4 flex shrink-0 items-start justify-between gap-4 border-b border-black/5 pb-3 dark:border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {displayName}
            </h2>
            <ExplorerFormatBadge
              format={actualFormat}
              className="bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-300"
            />
          </div>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {details}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-black/[0.03] dark:bg-white/[0.04]">
        {file.fileType === 'image' ? (
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={file.url}
              alt={displayName}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        ) : file.fileType === 'video' ? (
          <ExplorerVideoPreview key={file.id} file={file} />
        ) : file.fileType === 'pdf' || file.fileType === 'text' ? (
          <iframe src={file.url} title={displayName} className="h-full w-full border-0 bg-white" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
            <FileIcon size={40} strokeWidth={1.5} />
            <span className="text-xs font-medium">{displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ExplorerVideoPreview({ file }: { file: ExplorerFile }) {
  const sources = useMemo(() => {
    return Array.from(
      new Set([file.url, file.previewUrl, ...getVideoSources(file.url)].filter(Boolean))
    );
  }, [file.previewUrl, file.url]);
  const poster = useMemo(
    () => file.thumbnailUrl || getVideoPosterSource(file.url),
    [file.thumbnailUrl, file.url]
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const source = sources[sourceIndex] || file.url;

  const handleError = useCallback(() => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((current) => current + 1);
      setHasLoaded(false);
      return;
    }

    setHasError(true);
  }, [sourceIndex, sources.length]);

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <AlertTriangle className="h-7 w-7 text-amber-300" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-sm font-semibold">Video tidak bisa dimuat</h3>
          <p className="text-xs leading-relaxed text-white/65">
            Browser tidak menerima stream video dari storage. Coba buka file langsung atau upload
            ulang video dari Admin Explorer.
          </p>
        </div>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          Buka file asli
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {!hasLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-xs font-medium text-white/55">
          Memuat video...
        </div>
      )}
      <video
        key={source}
        src={withVideoStartTime(source)}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        className="relative z-10 h-full w-full bg-black object-contain"
        onLoadedData={() => setHasLoaded(true)}
        onCanPlay={() => setHasLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}

function FileThumbnail({
  file,
  size = 'md',
}: {
  file: ExplorerFile;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const displayName = getExplorerFileDisplayName(file);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isVideo = file.fileType === 'video';
  const isImage = file.fileType === 'image';
  const videoPoster = isVideo ? file.thumbnailUrl || getVideoPosterSource(file.url) : undefined;
  const videoPreview = isVideo ? getVideoPreviewSource(file.url) || file.url : undefined;
  const src = isVideo ? videoPoster || videoPreview : file.thumbnailUrl || file.url;

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-10 h-10',
    md: 'w-16 h-20',
    lg: 'w-24 h-32',
  };

  return (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center overflow-hidden border border-black/5 bg-white shadow-sm transition-shadow group-hover:shadow-md dark:border-white/10 dark:bg-white/10`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!src || hasError ? (
        <div className="flex flex-col items-center gap-1">
          {isVideo ? (
            <VideoIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" />
          ) : isImage ? (
            <ImageIcon size={size === 'xs' ? 12 : 24} className="text-green-500 opacity-60" />
          ) : (
            <FileIcon size={size === 'xs' ? 12 : 24} className="text-gray-400 opacity-60" />
          )}
        </div>
      ) : isVideo ? (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full w-full">
          {videoPoster ? (
            <img
              src={videoPoster}
              alt={displayName}
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setHasError(true)}
            />
          ) : (
            <video
              src={withVideoStartTime(videoPreview)}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setHasError(false)}
              onError={() => setHasError(true)}
            />
          )}
          {size !== 'xs' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <MonitorPlay size={size === 'sm' ? 14 : 20} className="text-white drop-shadow-md" />
            </div>
          )}
        </m.div>
      ) : (
        <m.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={src}
          alt={displayName}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}

      {/* Type Badge (Only for larger sizes) */}
      {size !== 'xs' && (
        <div
          className={`absolute inset-x-0 bottom-0 flex h-4 items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}
        >
          <span className="text-[7px] font-black uppercase tracking-tighter text-white">
            {file.metadata?.extension || file.fileType}
          </span>
        </div>
      )}
    </div>
  );
}

interface WindowImagePreviewProps {
  items: GalleryItem[];
  initialIndex?: number;
  onClose: () => void;
  groupName?: string;
  isWindowMaximized: boolean;
  onToggleWindowMaximize: () => void;
}

function WindowImagePreview({
  items,
  initialIndex = 0,
  onClose,
  groupName,
  isWindowMaximized,
  onToggleWindowMaximize,
}: WindowImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const validItems = items.filter((item) => item.isActive !== false);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === validItems.length - 1 ? 0 : prev + 1));
  }, [validItems.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validItems.length - 1 : prev - 1));
  }, [validItems.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onClose, handleNext, handlePrev]);

  if (validItems.length === 0) return null;

  const currentItem = validItems[currentIndex];

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-30 flex flex-col bg-black/95 select-none overflow-hidden"
      >
        {/* Header / Top Bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="text-xs sm:text-sm font-medium text-white/80 drop-shadow-md">
            {groupName && <span className="mr-2 opacity-70">{groupName} &bull;</span>}
            {currentIndex + 1} / {validItems.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleWindowMaximize}
              className="inline-flex items-center justify-center rounded-full bg-black/20 p-2 text-white/70 transition-all hover:bg-black/40 hover:text-white active:scale-90"
              aria-label={isWindowMaximized ? 'Restore window size' : 'Maximize window'}
            >
              {isWindowMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-black/20 p-2 text-white/70 transition-all hover:bg-black/40 hover:text-white active:scale-90"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 p-4 sm:p-12">
          <m.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex min-h-0 w-full flex-grow items-center justify-center"
          >
            {currentItem.kind === 'video' ? (
              <Media
                kind="video"
                src={currentItem.src}
                poster={currentItem.poster}
                className="max-h-full max-w-full rounded-none object-contain shadow-2xl"
                autoplay={true}
                muted={false}
                loop={true}
                playsInline={true}
                controls={true}
              />
            ) : (
              <img
                src={getProxiedUrl(currentItem.src)}
                alt={currentItem.alt || `Gallery Image ${currentIndex + 1}`}
                className="max-h-full max-w-full select-none rounded-none object-contain shadow-2xl"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </m.div>

          {/* Thumbnails Ribbon */}
          {validItems.length > 1 && (
            <div className="flex w-full justify-center pb-2">
              <div className="no-scrollbar pointer-events-auto flex max-w-full items-center justify-start gap-2 overflow-x-auto scroll-smooth p-1">
                {validItems.map((item, index) => (
                  <button
                    key={`thumb-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`relative h-10 w-10 flex-shrink-0 overflow-hidden border transition-all duration-300 sm:h-14 sm:w-14 rounded-none ${
                      index === currentIndex
                        ? 'z-10 scale-105 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                        : 'border-white/10 opacity-40 hover:scale-105 hover:opacity-100'
                    }`}
                  >
                    {item.kind === 'video' ? (
                      <div className="flex h-full w-full items-center justify-center bg-gray-900">
                        {item.poster ? (
                          <img
                            src={getProxiedUrl(item.poster)}
                            alt=""
                            className="h-full w-full object-cover rounded-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/50">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="flex h-4 w-4 items-center justify-center">
                            <div className="ml-0.5 h-0 w-0 border-b-[4px] border-l-[7px] border-t-[4px] border-b-transparent border-l-white border-t-transparent" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getProxiedUrl(item.src)}
                        alt=""
                        className="h-full w-full object-cover rounded-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {validItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="group absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-2.5 text-white/50 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white sm:block active:scale-90"
            >
              <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="group absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-2.5 text-white/50 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white sm:block active:scale-90"
            >
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Mobile invisible touch zones for navigation */}
            <div className="absolute inset-y-0 left-0 z-0 w-1/4 sm:hidden cursor-w-resize" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 z-0 w-1/4 sm:hidden cursor-e-resize" onClick={handleNext} />
          </>
        )}
      </m.div>
    </AnimatePresence>
  );
}
