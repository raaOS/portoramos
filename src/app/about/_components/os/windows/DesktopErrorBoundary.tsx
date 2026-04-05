"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, Power } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class DesktopErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Desktop Environment Crashed:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleSafeMode = () => {
        // Clear potential corruption sources
        try {
            localStorage.removeItem('ramos-positions-v2');
            localStorage.removeItem('dock-config');
            sessionStorage.removeItem('ramos-session-positions');
            sessionStorage.removeItem('ramos_os_welcome_seen');
            sessionStorage.removeItem('ramos_os_booted');
        } catch {
            console.error("Failed to clear local or session storage");
        }
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] bg-[#0078D7] text-white font-mono flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden">
                    <div className="max-w-2xl w-full flex flex-col items-start text-left">
                        <span className="text-8xl mb-8">:(</span>
                        <h1 className="text-3xl mb-8">
                            Your PC ran into a problem and needs to restart.
                        </h1>
                        <p className="text-xl mb-8">
                            We&apos;re just collecting some error info, and then we&apos;ll restart for you.
                        </p>

                        <div className="bg-white/10 p-4 rounded-lg w-full mb-8 font-mono text-sm">
                            <p className="mb-2 text-yellow-300">Error Code: CRITICAL_PROCESS_DIED</p>
                            {this.state.error && (
                                <p className="opacity-80 break-words">
                                    {this.state.error.toString()}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-[#0078D7] rounded hover:bg-white/90 transition-colors font-bold"
                            >
                                <RefreshCw size={20} />
                                Restart PC
                            </button>

                            <button
                                onClick={this.handleSafeMode}
                                className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-white text-white rounded hover:bg-white/10 transition-colors font-bold"
                            >
                                <Power size={20} />
                                Safe Mode (Reset Config)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
