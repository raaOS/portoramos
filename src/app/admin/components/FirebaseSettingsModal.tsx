'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Database, Server } from 'lucide-react';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';

interface FirebaseSettingsModalProps {
    onCancel: () => void;
}

interface HealthStatus {
    status: string;
    firebase?: string;
    databaseURL?: string;
    timestamp: string;
}

export default function FirebaseSettingsModal({ onCancel }: FirebaseSettingsModalProps) {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    useEffect(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                setHealth(data);
            })
            .catch(() => {
                setHealth({ status: 'error', timestamp: new Date().toISOString() });
            });
    }, []);

    const isConnected = health?.firebase === 'connected';

    return (
        <AdminModal
            isOpen={true}
            onClose={onCancel}
            title="Firebase Connection Status"
            size="md"
            actions={
                <AdminButton variant="secondary" onClick={onCancel}>
                    Tutup
                </AdminButton>
            }
        >
            <div className="space-y-6">
                {/* Status Card */}
                <div className={`border rounded-lg p-4 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center">
                        {isConnected ? (
                            <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
                        ) : (
                            <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                        )}
                        <div>
                            <h3 className={`font-semibold ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                                {isConnected ? 'Firebase Terhubung' : 'Firebase Tidak Terhubung'}
                            </h3>
                            <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {isConnected
                                    ? 'Realtime Database dan Storage aktif'
                                    : 'Periksa konfigurasi environment variables'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <Database className="w-5 h-5 text-violet-600 mt-0.5 mr-3" />
                            <div>
                                <h4 className="font-medium text-gray-900">Realtime Database</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Data proyek, komentar, dan chat disimpan di Firebase Realtime Database.
                                    Perubahan tersinkron secara real-time.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <Server className="w-5 h-5 text-violet-600 mt-0.5 mr-3" />
                            <div>
                                <h4 className="font-medium text-gray-900">Cloud Storage</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Gambar dan aset media disimpan di Firebase Cloud Storage.
                                    CDN global untuk akses cepat.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Konfigurasi</h4>
                    <p className="text-sm text-blue-800">
                        Firebase dikonfigurasi melalui environment variables di server (Vercel).
                        Hubungi administrator untuk mengubah pengaturan.
                    </p>
                    <div className="mt-3 text-xs text-blue-600 font-mono">
                        Variables: FIREBASE_PROJECT_ID, FIREBASE_DATABASE_URL, FIREBASE_STORAGE_BUCKET
                    </div>
                </div>

                {/* Last Check */}
                {health?.timestamp && (
                    <div className="text-right text-xs text-gray-500">
                        Terakhir diperiksa: {new Date(health.timestamp).toLocaleString('id-ID')}
                    </div>
                )}
            </div>
        </AdminModal>
    );
}
