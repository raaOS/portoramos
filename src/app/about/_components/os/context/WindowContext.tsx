"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useWindowManager, WindowState } from "@/hooks/useWindowManager";
import { AboutData } from "@/types/about";
import { Project } from "@/types/projects";

// Extract the return type of useWindowManager to use as our Context type
type WindowManagerReturn = ReturnType<typeof useWindowManager>;

export interface WindowContextType extends WindowManagerReturn {
    // We can add additional top-level state here later if needed, 
    // like spotlight state, but for now we stick to windows.
}

export const WindowContext = createContext<WindowContextType | null>(null);

interface WindowProviderProps {
    children: ReactNode;
    initialWindows: WindowState[];
    aboutData?: AboutData | null;
    projects: Project[];
    csrfToken?: string;
}

export function WindowProvider({
    children,
    initialWindows,
    aboutData,
    projects,
    csrfToken
}: WindowProviderProps) {
    const windowManager = useWindowManager({
        initialWindows,
        aboutData,
        projects,
        csrfToken
    });

    return (
        <WindowContext.Provider value={windowManager}>
            {children}
        </WindowContext.Provider>
    );
}

export function useWindowContext() {
    const context = useContext(WindowContext);
    if (!context) {
        throw new Error("useWindowContext must be used within a WindowProvider");
    }
    return context;
}
