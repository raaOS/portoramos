'use client';

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Grid, LayoutList, Box } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ModeOption {
    id: string;
    label: string;
    icon: React.ElementType;
    view: string;
    description: string;
}

const MODES: ModeOption[] = [
    { id: 'grid', label: 'Grid View', icon: Grid, view: 'grid', description: 'Pinterest style masonry' },
    { id: 'list', label: 'List View', icon: LayoutList, view: 'list', description: 'Clean minimal rows' },
    { id: 'canvas', label: '3D Canvas', icon: Box, view: 'canvas', description: 'Infinite 3D exploration' },
];

interface Props {
    onSelect?: () => void;
}

export default function DockProjectModes({ onSelect }: Props) {
    const router = useRouter();

    const handleModeSelect = (view: string) => {
        if (onSelect) onSelect();
        router.push(`/projects?view=${view}`);
    };

    return (
        <div className="flex flex-col gap-1 p-2 min-w-[180px]">
             {/* Title Header */}
             <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">Select View Mode</span>
            </div>

            <div className="flex flex-col gap-1">
                {MODES.map((mode, idx) => (
                    <m.button
                        key={mode.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 + 0.1, duration: 0.2 }}
                        onClick={() => handleModeSelect(mode.view)}
                        className="group flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-black/5 transition-all relative overflow-hidden text-left"
                    >
                        {/* Micro Preview Container */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-white group-hover:shadow-sm border border-black/5 transition-all shrink-0">
                            <mode.icon className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 transition-colors" strokeWidth={1.5} />
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-900 leading-none mb-1">{mode.label}</span>
                            <span className="text-[10px] text-zinc-500 leading-none">{mode.description}</span>
                        </div>

                        {/* Hover Bouncy Detail */}
                        <m.div 
                            className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ x: [0, 4, 0], transition: { repeat: Infinity, duration: 1.5 } }}
                        >
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </m.div>
                    </m.button>
                ))}
            </div>
        </div>
    );
}
