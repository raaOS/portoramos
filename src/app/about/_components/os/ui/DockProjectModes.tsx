'use client';

import React, { useCallback } from 'react';
import { m } from 'motion/react';
import { Grid, LayoutList, Box } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link, { useLinkStatus } from 'next/link';
import { AnimatePresence } from 'motion/react';

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
    { id: 'canvas', label: '3D Canvas', icon: Box, view: '3d', description: 'Infinite 3D exploration' },
];

const STAGGER_BASE_DELAY = 0.1;
const STAGGER_INCREMENT = 0.05;

interface DockProjectModesProps {
    onSelect?: () => void;
}

export default function DockProjectModes({ onSelect }: DockProjectModesProps) {
    const router = useRouter();

    const handleModeSelect = useCallback(() => {
        onSelect?.();
    }, [onSelect]);

    return (
        <div className="flex flex-col gap-1 p-2 min-w-[180px]" role="menu" aria-label="Select project view mode">
             {/* Title Header */}
             <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">Select View Mode</span>
            </div>

            <div className="flex flex-col gap-1">
                {MODES.map((mode, idx) => (
                    <ModeButton 
                        key={mode.id} 
                        mode={mode} 
                        idx={idx} 
                        onClick={handleModeSelect} 
                    />
                ))}
            </div>
        </div>
    );
}

function ModeButton({ mode, idx, onClick }: { mode: ModeOption, idx: number, onClick: () => void }) {
    const { pending } = useLinkStatus();
    
    return (
        <Link
            href={`/projects?view=${mode.view}`}
            role="menuitem"
            aria-label={`${mode.label}: ${mode.description}`}
            onClick={onClick}
            prefetch={true}
            className="group/mode flex items-center gap-3 w-full p-2.5 rounded-xl border border-transparent hover:border-[#00880B] hover:bg-[#E6F7E8] active:border-[#00880B] active:bg-[#E6F7E8] focus-visible:border-[#00880B] focus-visible:bg-[#E6F7E8] focus-visible:outline-none transition-all relative overflow-hidden text-left no-underline"
        >
            <AnimatePresence>
                {pending && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 rounded-xl bg-[#00880B]/5 ring-1 ring-[#00880B]/20 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <m.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * STAGGER_INCREMENT + STAGGER_BASE_DELAY, duration: 0.2 }}
                className="flex items-center gap-3 w-full relative z-10"
            >
                {/* Micro Preview Container */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 group-hover/mode:bg-[#E6F7E8] group-active/mode:bg-[#E6F7E8] group-focus-visible/mode:bg-[#E6F7E8] transition-all shrink-0">
                    <mode.icon className="w-5 h-5 text-zinc-900 group-hover/mode:text-[#00880B] group-active/mode:text-[#00880B] group-focus-visible/mode:text-[#00880B] transition-colors" strokeWidth={1.5} />
                </div>
                
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900 group-hover/mode:text-[#00880B] group-active/mode:text-[#00880B] group-focus-visible/mode:text-[#00880B] leading-none mb-1 transition-colors">{mode.label}</span>
                    <span className="text-[10px] text-zinc-700 group-hover/mode:text-[#00880B] group-active/mode:text-[#00880B] group-focus-visible/mode:text-[#00880B] leading-none transition-colors">{mode.description}</span>
                </div>
            </m.div>
        </Link>
    );
}
