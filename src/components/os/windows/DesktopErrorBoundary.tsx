"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, Power, AlertTriangle } from "lucide-react";
import { Z_LAYERS } from "../utils/zIndexLayers";

interface Props {
    children: ReactNode;
    /**
     * Only clear local/session storage saat user konfirmasi Safe Mode.
     * Admin yang punya buffer posisi lokal tidak kehilangan data
     * akibat error transient.
     */
    isAdmin?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    showSafeModeConfirm: boolean;
}

export default class DesktopErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        showSafeModeConfirm: false,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Desktop Environment Crashed:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    /**
     * Jangan langsung clear — kasih konfirmasi dulu.
     * Admin yang error sekali saja bisa kehilangan buffer posisi
     * kalau kita auto-clear. Sekarang harus klik 2x secara eksplisit.
     */
    private handleSafeModeRequest = () => {
        this.setState({ showSafeModeConfirm: true });
    };

    private handleSafeModeCancel = () => {
        this.setState({ showSafeModeConfirm: false });
    };

    private handleSafeModeConfirm = () => {
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
            const { showSafeModeConfirm } = this.state;
            const { isAdmin } = this.props;

            return (
                <div
                    className="fixed inset-0 bg-[#0078D7] text-white font-mono flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden"
                    style={{ zIndex: Z_LAYERS.BACKDROP }}
                >
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

                        {showSafeModeConfirm ? (
                            <div className="w-full bg-yellow-500/15 border border-yellow-300/60 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={22} className="text-yellow-300 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <p className="font-bold text-yellow-100 mb-2">
                                            Confirm Safe Mode Reset
                                        </p>
                                        <p className="text-sm text-yellow-50/90 mb-4">
                                            {isAdmin
                                                ? 'Admin buffer (window positions, icon layout, dock config) akan dihapus dari browser ini. Posisi yang sudah di-flush ke server tetap aman.'
                                                : 'Local desktop state akan dihapus. Lanjutkan?'}
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={this.handleSafeModeConfirm}
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold text-sm"
                                            >
                                                Yes, Clear & Restart
                                            </button>
                                            <button
                                                onClick={this.handleSafeModeCancel}
                                                className="px-4 py-2 bg-transparent border border-white/40 text-white rounded hover:bg-white/10 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-[#0078D7] rounded hover:bg-white/90 transition-colors font-bold"
                            >
                                <RefreshCw size={20} />
                                Restart PC
                            </button>

                            <button
                                onClick={this.handleSafeModeRequest}
                                disabled={showSafeModeConfirm}
                                className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-white text-white rounded hover:bg-white/10 transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed"
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
