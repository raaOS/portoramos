'use client';

import { MapPin, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import type { LocationData, LocationStatus } from '../_hooks';

interface LocationStatusProps {
    status: LocationStatus;
    location: LocationData | null;
    error: string;
    formatAccuracy: (accuracy: number) => string;
    onRetry: () => void;
    onRefresh: () => void;
    onShowHelp: () => void;
}

export function LocationStatusPanel({
    status,
    location,
    error,
    formatAccuracy,
    onRetry,
    onRefresh,
    onShowHelp
}: LocationStatusProps) {
    const getStatusStyles = () => {
        switch (status) {
            case 'granted':
                return 'bg-green-50 border-green-200';
            case 'denied':
            case 'error':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-white border-gray-200';
        }
    };

    const getIconStyles = () => {
        switch (status) {
            case 'granted':
                return 'bg-green-100 text-green-600';
            case 'denied':
                return 'bg-red-100 text-red-600';
            case 'error':
                return 'bg-orange-100 text-orange-600';
            case 'requesting':
                return 'bg-yellow-100 text-yellow-600';
            default:
                return 'bg-gray-100 text-gray-400';
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'granted':
                return <MapPin className="w-5 h-5" />;
            case 'denied':
                return <Shield className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            case 'requesting':
                return <RefreshCw className="w-5 h-5 animate-spin" />;
            default:
                return <MapPin className="w-5 h-5" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'idle':
            case 'checking':
                return 'Memeriksa izin lokasi...';
            case 'requesting':
                return 'Mendeteksi lokasi...';
            case 'granted':
                return 'Lokasi berhasil dideteksi';
            case 'denied':
                return '✗ Izin lokasi ditolak';
            case 'error':
                return '⚠ Gagal mendeteksi lokasi';
            case 'unsupported':
                return '✗ Browser tidak support';
            default:
                return '';
        }
    };

    const getTextColor = () => {
        if (status === 'granted') return 'text-green-800';
        if (status === 'denied' || status === 'error') return 'text-red-800';
        return 'text-gray-900';
    };

    return (
        <div className={`rounded-lg border p-4 ${getStatusStyles()}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getIconStyles()}`}>
                        {getIcon()}
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${getTextColor()}`}>
                            {getStatusText()}
                        </p>
                        {location && (
                            <p className="text-xs text-green-600">
                                Akurasi: {formatAccuracy(location.accuracy)}
                            </p>
                        )}
                        {error && (
                            <p className="text-xs text-red-600 mt-1 max-w-[200px]">
                                {error}
                            </p>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onShowHelp}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Panduan mengaktifkan lokasi"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>

            {/* Action buttons based on status */}
            {(status === 'denied' || status === 'error') && (
                <div className="mt-3 space-y-2">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Coba Lagi
                    </button>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Halaman
                    </button>
                </div>
            )}
        </div>
    );
}
