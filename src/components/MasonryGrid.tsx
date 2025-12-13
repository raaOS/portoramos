'use client';

import React from 'react';
import Masonry from 'react-masonry-css';

interface MasonryGridProps {
    children: React.ReactNode;
    className?: string;
}

const breakpointColumns = {
    default: 7,    // Desktop XL (1536px+)
    1536: 5,       // Desktop L
    1280: 4,       // Desktop
    1024: 3,       // Tablet L
    768: 2,        // Tablet
    640: 2         // Mobile L
};

export default function MasonryGrid({ children, className = '' }: MasonryGridProps) {
    return (
        <Masonry
            breakpointCols={breakpointColumns}
            className={`masonry-grid ${className}`}
            columnClassName="masonry-grid-column"
        >
            {children}
        </Masonry>
    );
}
