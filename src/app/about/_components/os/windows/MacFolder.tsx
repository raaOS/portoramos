import React, { useState } from 'react';

// Helper to darken hex color
const darkenColor = (hex: string, percent: number) => {
    let color = hex.startsWith('#') ? hex.slice(1) : hex;
    if (color.length === 3) {
        color = color
            .split('')
            .map(c => c + c)
            .join('');
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

interface FolderProps {
    color?: string;
    size?: number;
    items?: React.ReactNode[];
    className?: string;
    label?: string;
    subLabel?: string;
    onClick?: () => void;
    count?: number;
    isStatic?: boolean;
}

const MacFolder = ({
    color = '#3B82F6',
    size = 1.2,
    items = [],
    className = '',
    label,
    subLabel,
    onClick,
    count,
    isStatic = false,
}: FolderProps) => {
    const maxItems = 3;
    const papers = items.length > 0 ? items.slice(0, maxItems) : Array(3).fill(null);

    while (papers.length < maxItems) {
        papers.push(null);
    }

    const [open, setOpen] = useState(false);
    const [paperOffsets, setPaperOffsets] = useState(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));

    const folderBackColor = darkenColor(color, 0.08);
    const paper1 = darkenColor('#ffffff', 0.1);
    const paper2 = darkenColor('#ffffff', 0.05);
    const paper3 = '#ffffff';

    const handleClick = () => {
        if (!isStatic) {
            setOpen(prev => !prev);
            if (open) {
                setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
            }
        }
        // Only trigger parent navigation if folder is already open or we want valid click action
        // But aligning with React Bits, usually click toggles open. 
        // If we want double click or specific logic:
        if (onClick) onClick();
    };

    const handlePaperMouseMove = (e: React.MouseEvent, index: number) => {
        if (!open) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = (e.clientX - centerX) * 0.15;
        const offsetY = (e.clientY - centerY) * 0.15;
        setPaperOffsets(prev => {
            const newOffsets = [...prev];
            newOffsets[index] = { x: offsetX, y: offsetY };
            return newOffsets;
        });
    };

    const handlePaperMouseLeave = (e: React.MouseEvent, index: number) => {
        setPaperOffsets(prev => {
            const newOffsets = [...prev];
            newOffsets[index] = { x: 0, y: 0 };
            return newOffsets;
        });
    };

    const folderStyle = {
        '--folder-color': color,
        '--folder-back-color': folderBackColor,
        '--paper-1': paper1,
        '--paper-2': paper2,
        '--paper-3': paper3
    } as React.CSSProperties;

    const scaleStyle = { transform: `scale(${size})` };

    const getOpenTransform = (index: number) => {
        if (index === 0) return 'translate(-120%, -70%) rotate(-15deg)';
        if (index === 1) return 'translate(10%, -70%) rotate(15deg)';
        if (index === 2) return 'translate(-50%, -100%) rotate(5deg)';
        return '';
    };

    return (
        <div className={`flex flex-col items-center gap-6 ${className}`}>
            <div style={scaleStyle} className="mt-4">

                {/* Stable Wrapper (Group) - The static hit area */}
                <div
                    className="group relative cursor-pointer"
                    onClick={handleClick}
                >
                    {/* Visual Folder Component - Moves on group hover */}
                    <div
                        className="relative transition-all duration-200 ease-in"
                        style={{
                            ...folderStyle,
                            transform: open ? 'translateY(10px)' : undefined
                        }}
                    >
                        <div
                            className="relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
                            style={{ backgroundColor: folderBackColor }}
                        >
                            <span
                                className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
                                style={{ backgroundColor: folderBackColor }}
                            ></span>

                            {/* BADGE COUNT */}
                            {count !== undefined && count > 0 && (
                                <div className={`absolute -top-3 -right-3 z-50 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100 delay-300'}`}>
                                    {count}
                                </div>
                            )}

                            {papers.map((item, i) => {
                                let sizeClasses = '';
                                if (i === 0) sizeClasses = open ? 'w-[70%] h-[80%]' : 'w-[70%] h-[80%]';
                                if (i === 1) sizeClasses = open ? 'w-[80%] h-[80%]' : 'w-[80%] h-[70%]';
                                if (i === 2) sizeClasses = open ? 'w-[90%] h-[80%]' : 'w-[90%] h-[60%]';

                                const transformStyle = open
                                    ? `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`
                                    : undefined;

                                return (
                                    <div
                                        key={i}
                                        onMouseMove={e => handlePaperMouseMove(e, i)}
                                        onMouseLeave={e => handlePaperMouseLeave(e, i)}
                                        className={`absolute z-20 bottom-[10%] left-1/2 transition-all duration-300 ease-in-out ${!open ? 'transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0' : 'hover:scale-110'
                                            } ${sizeClasses}`}
                                        style={{
                                            ...(!open ? {} : { transform: transformStyle }),
                                            backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                                            borderRadius: '10px'
                                        }}
                                    >
                                        {item}
                                    </div>
                                );
                            })}
                            <div
                                className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${!open ? 'group-hover:[transform:skew(15deg)_scaleY(0.6)]' : ''
                                    }`}
                                style={{
                                    backgroundColor: color,
                                    borderRadius: '5px 10px 10px 10px',
                                    ...(open && { transform: 'skew(15deg) scaleY(0.6)' })
                                }}
                            ></div>
                            <div
                                className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${!open ? 'group-hover:[transform:skew(-15deg)_scaleY(0.6)]' : ''
                                    }`}
                                style={{
                                    backgroundColor: color,
                                    borderRadius: '5px 10px 10px 10px',
                                    ...(open && { transform: 'skew(-15deg) scaleY(0.6)' })
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* LABELS */}
                {label && (
                    <div className="flex flex-col items-center justify-start z-30 mt-2 pointer-events-none w-24 h-14">
                        <h3 className="text-[11px] font-semibold text-neutral-800 leading-tight transition-colors text-center line-clamp-2 w-full break-words">
                            {label}
                        </h3>
                        {subLabel && (
                            <p className="text-[9px] text-neutral-500 font-medium mt-0.5 whitespace-nowrap">
                                {subLabel}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MacFolder;
