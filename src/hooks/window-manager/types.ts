import React from "react";

export interface WindowState {
    id: string;
    title: string;
    isOpen: boolean;
    isMinimized?: boolean;
    isMaximized?: boolean;
    zIndex: number;
    noPadding?: boolean;
    content: React.ReactNode;
    contentFactory?: () => React.ReactNode;
    initialPosition?: { x: number; y: number };
    width?: number;
    height?: number;
    isPinned?: boolean;
}
