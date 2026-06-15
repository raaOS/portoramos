'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Database, Server } from 'lucide-react';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';

interface DataConnectionModalProps {
  onCancel: () => void;
}

interface HealthStatus {
  status: string;
  database?: string;
  databaseBackend?: string;
  timestamp: string;
}

export default function DataConnectionModal({ onCancel }: DataConnectionModalProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
      })
      .catch(() => {
        setHealth({ status: 'error', timestamp: new Date().toISOString() });
      });
  }, []);

  const isConnected =
    health?.database === 'connected' && health?.databaseBackend === 'cloudflare-d1';

  return (
    <AdminModal
      isOpen={true}
      onClose={onCancel}
      title="Data Connection Status"
      size="md"
      actions={
        <AdminButton variant="secondary" onClick={onCancel}>
          Tutup
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* Status Card */}
        <div
          className={`rounded-lg border p-4 ${isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          <div className="flex items-center">
            {isConnected ? (
              <CheckCircle2 className="mr-3 h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="mr-3 h-8 w-8 text-red-600" />
            )}
            <div>
              <h3 className={`font-semibold ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                {isConnected ? 'Database Terhubung' : 'Database Tidak Terhubung'}
              </h3>
              <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Cloudflare D1 aktif' : 'Periksa konfigurasi environment variables'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start">
              <Database className="mr-3 mt-0.5 h-5 w-5 text-violet-600" />
              <div>
                <h4 className="font-medium text-gray-900">Cloudflare D1</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Data proyek, komentar, dan chat disimpan di Cloudflare D1. Perubahan dicek berkala
                  dari endpoint versi data.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start">
              <Server className="mr-3 mt-0.5 h-5 w-5 text-violet-600" />
              <div>
                <h4 className="font-medium text-gray-900">Media Storage</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Gambar dan aset media disimpan di Cloudflare R2. Storage media lama sudah tidak
                  dipakai.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">Konfigurasi</h4>
          <p className="text-sm text-blue-800">
            Cloudflare D1 dan R2 dikonfigurasi melalui environment variables di server. Hubungi
            administrator untuk mengubah pengaturan.
          </p>
          <div className="mt-3 font-mono text-xs text-blue-600">
            Backend: {health?.databaseBackend || 'unknown'}
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
