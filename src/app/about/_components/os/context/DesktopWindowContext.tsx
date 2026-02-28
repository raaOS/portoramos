"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useWindowManager, WindowState } from "@/hooks/useWindowManager";
import { AboutData } from "@/types/about";
import { Project } from "@/types/projects";

// Extract the return type of useWindowManager to use as our Context type
type WindowManagerReturn = ReturnType<typeof useWindowManager>;

export interface DesktopWindowContextType extends WindowManagerReturn {
    // We can add additional top-level state here later if needed, 
    // like spotlight state, but for now we stick to windows.
}

export const DesktopWindowContext = createContext<DesktopWindowContextType | null>(null);

interface DesktopWindowProviderProps {
    children: ReactNode;
    initialWindows: WindowState[];
    aboutData?: AboutData | null;
    projects: Project[];
    csrfToken?: string;
}

export function DesktopWindowProvider({
    children,
    initialWindows,
    aboutData,
    projects,
    csrfToken
}: DesktopWindowProviderProps) {
    const windowManager = useWindowManager({
        initialWindows,
        aboutData,
        projects,
        csrfToken
    });

    return (
        <DesktopWindowContext.Provider value={windowManager}>
            {children}
        </DesktopWindowContext.Provider>
    );
}

export function useDesktopWindowContext() {
    const context = useContext(DesktopWindowContext);
    if (!context) {
        throw new Error("useDesktopWindowContext must be used within a DesktopWindowProvider");
    }
    return context;
}
