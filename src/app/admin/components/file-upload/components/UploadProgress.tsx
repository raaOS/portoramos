'use client';

import { Loader2, CheckCircle2 } from 'lucide-react';

interface UploadProgressProps {
    status: string;
    progress: number;
}

export function UploadProgress({ status, progress }: UploadProgressProps) {
    const isComplete = status === 'Upload Complete!';

    return (
        <div className="space-y-4 w-full max-w-md mx-auto" aria-live="polite">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                    {isComplete ? (
                        <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-green-100 animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-violet-100">
                                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-1 text-center">
                    <p className={`text-sm font-semibold ${isComplete ? 'text-green-600' : 'text-gray-900'}`}>
                        {status}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{progress}% Complete</p>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
