"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, FileText, AppWindow, Command } from "lucide-react";
import type { Project } from "@/types/projects";

interface SpotlightProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onOpenProject: (project: Project) => void;
    onOpenApp: (id: string) => void;
}

export default function Spotlight({ isOpen, onClose, projects, onOpenProject, onOpenApp }: SpotlightProps) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const systemApps = [
        { id: "about", title: "About Me", type: "app" },
        { id: "projects", title: "Launchpad", type: "app" },
        { id: "gallery", title: "Photos", type: "app" },
        { id: "game", title: "Snake Game", type: "app" },
        { id: "settings", title: "System Settings", type: "app" },
        { id: "contact", title: "Contact", type: "app" },
    ];

    const results = [
        ...systemApps.filter(app => app.title.toLowerCase().includes(query.toLowerCase())),
        ...projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).map(p => ({ ...p, type: 'project' }))
    ].slice(0, 8);

    // Reset state saat Spotlight dibuka
    // setState dijalankan di microtask (setTimeout 0) untuk menghindari cascading render
    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => {
                setSelectedIndex(0);
                setQuery('');
            }, 0);
            inputRef.current?.focus();
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
            const selected = results[selectedIndex];
            if (selected) {
                if ('type' in selected && selected.type === 'app') {
                    onOpenApp(selected.id);
                } else {
                    onOpenProject(selected as Project);
                    onClose();
                }
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[10002] flex items-start justify-center pt-[20vh] bg-black/20 pointer-events-auto print:hidden"
            onClick={onClose}
        >
            <motion.div
                className="w-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Search Input */}
                <div className="flex items-center px-4 py-4 border-b border-gray-200">
                    <Search className="text-gray-400 mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Spotlight Search"
                        className="flex-1 bg-transparent border-none outline-none text-xl text-gray-800 placeholder:text-gray-400"
                    />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-400 font-medium">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto py-2">
                    {results.length > 0 ? (
                        results.map((res, i) => (
                            <div
                                key={res.id}
                                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${i === selectedIndex ? 'bg-blue-500 text-white' : 'hover:bg-black/5 text-gray-700'}`}
                                onClick={() => {
                                    if ('type' in res && res.type === 'app') {
                                        onOpenApp(res.id);
                                    } else {
                                        onOpenProject(res as Project);
                                        onClose();
                                    }
                                }}
                                onMouseEnter={() => setSelectedIndex(i)}
                            >
                                {'type' in res && res.type === 'app' ? (
                                    <AppWindow size={18} className={i === selectedIndex ? 'text-white' : 'text-blue-500'} />
                                ) : (
                                    <FileText size={18} className={i === selectedIndex ? 'text-white' : 'text-orange-500'} />
                                )}
                                <span className="flex-1 font-medium">{res.title}</span>
                                {i === selectedIndex && (
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

                {/* Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400">
                    <div className="flex gap-3">
                        <span><span className="font-bold">↑↓</span> to navigate</span>
                        <span><span className="font-bold">Enter</span> to open</span>
                        <span><span className="font-bold">Esc</span> to close</span>
                    </div>
                    <div className="flex items-center gap-1">
                        Powered by Gemini
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
