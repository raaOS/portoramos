'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, FileText, AppWindow, Command } from 'lucide-react';
import type { Project } from '@/types/projects';
import { Z_LAYERS } from '../utils/zIndexLayers';

const SYSTEM_APPS = [
  { id: 'about', title: 'About Me', type: 'app' as const },
  { id: 'whatsapp', title: 'WhatsApp', type: 'app' as const },
  { id: 'contact', title: 'Contact', type: 'app' as const },
  { id: 'trash-bin', title: 'Trash', type: 'app' as const },
];
type SpotlightResult =
  | (typeof SYSTEM_APPS)[number]
  | { id: string; title: string; type: 'project'; project: Project };

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onOpenApp: (id: string) => void;
}

/**
 * Lightweight fuzzy scorer: checks if all query characters appear in order.
 * Returns a simple score (higher = better match). Returns 0 for no match.
 * This replaces exact `.includes()` to support typos and partial matches.
 */
function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring match → highest priority
  if (t.includes(q)) return 100;

  // Subsequence match: all query chars appear in order
  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      score += 1;
      // Bonus for consecutive matches
      if (ti > 0 && q[qi - 2] !== undefined && t[ti - 1] === q[qi - 2]) score += 2;
    }
  }

  // All query characters matched in order
  return qi === q.length ? score : 0;
}

export default function Spotlight({
  isOpen,
  onClose,
  projects,
  onOpenProject,
  onOpenApp,
}: SpotlightProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SpotlightResult[]>(() => {
    if (!query.trim()) {
      return [
        ...SYSTEM_APPS,
        ...projects.slice(0, 8 - SYSTEM_APPS.length).map((project) => ({
          id: project.id,
          title: project.title,
          type: 'project' as const,
          project,
        })),
      ];
    }

    const scored: Array<{ item: SpotlightResult; score: number }> = [];

    for (const app of SYSTEM_APPS) {
      const score = fuzzyMatch(query, app.title);
      if (score > 0) scored.push({ item: app, score });
    }

    for (const project of projects) {
      const score = fuzzyMatch(query, project.title);
      if (score > 0) {
        scored.push({
          item: {
            id: project.id,
            title: project.title,
            type: 'project' as const,
            project,
          },
          score,
        });
      }
    }

    // Sort by score descending, take top 8
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.item);
  }, [query, projects]);

  const safeSelectedIndex = results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setTimeout(() => {
      setSelectedIndex(0);
      setQuery('');
      inputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const openResult = (result: (typeof results)[number]) => {
    if (result.type === 'app') {
      onOpenApp(result.id);
      onClose();
      return;
    }

    onOpenProject(result.project);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (results.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      return;
    }

    if (event.key === 'Enter') {
      const selected = results[safeSelectedIndex];
      if (selected) {
        openResult(selected);
      }
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-label="Spotlight Search"
      aria-modal="true"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="pointer-events-auto fixed inset-0 flex items-start justify-center bg-black/20 print:hidden"
      style={{ zIndex: Z_LAYERS.POPOUT_CONTENT }}
      onClick={onClose}
    >
      <motion.div
        className="w-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b border-gray-200 px-4 py-4">
          <Search className="mr-3 text-gray-400" size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Spotlight Search"
            aria-label="Search applications and projects"
            aria-autocomplete="list"
            aria-controls="spotlight-results"
            className="flex-1 border-none bg-transparent text-xl text-gray-800 outline-none placeholder:text-gray-400"
          />
          <div className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-400">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>

        <div id="spotlight-results" role="listbox" className="max-h-[400px] overflow-y-auto py-2">
          {results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={result.id}
                role="option"
                aria-selected={index === safeSelectedIndex}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                  index === safeSelectedIndex
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-black/5'
                }`}
                onClick={() => openResult(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {result.type === 'app' ? (
                  <AppWindow
                    size={18}
                    className={index === safeSelectedIndex ? 'text-white' : 'text-gray-400'}
                  />
                ) : (
                  <FileText
                    size={18}
                    className={index === safeSelectedIndex ? 'text-white' : 'text-orange-500'}
                  />
                )}
                <span className="flex-1 font-medium">{result.title}</span>
                {index === safeSelectedIndex && (
                  <span className="text-[10px] opacity-70">Enter to Open</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-400">
              No results for &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 text-[10px] text-gray-400">
          <div className="flex gap-3">
            <span>
              <span className="font-bold">Up/Down</span> to navigate
            </span>
            <span>
              <span className="font-bold">Enter</span> to open
            </span>
            <span>
              <span className="font-bold">Esc</span> to close
            </span>
          </div>
          <div className="flex items-center gap-1">Powered by Gemini</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
