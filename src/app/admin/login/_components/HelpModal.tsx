'use client';

import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Cara Mengaktifkan Lokasi</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 text-sm text-gray-600">
          <div className="rounded border border-red-200 bg-red-50 p-3">
            <p className="font-medium text-red-800">⚠️ Masalah Umum di Localhost</p>
            <p className="mt-1 text-red-700">
              Chrome kadang memblokir geolocation di localhost meski sudah di-allow. Solusi:{' '}
              <strong>Refresh halaman (F5)</strong> atau klik tombol &quot;Coba Lagi&quot; setelah
              mengizinkan lokasi.
            </p>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-900">Langkah 1: Allow di Browser</p>
            <ol className="ml-2 list-inside list-decimal space-y-1">
              <li>Klik ikon gembok (🔒) atau lokasi (📍) di sebelah kiri address bar</li>
              <li>Pastikan &quot;Location&quot; di-set ke &quot;Allow&quot;</li>
              <li>
                Jika ada popup &quot;Allow... to know your location&quot;, klik &quot;Allow&quot;
              </li>
            </ol>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-900">Langkah 2: Windows Location</p>
            <ol className="ml-2 list-inside list-decimal space-y-1">
              <li>Buka Windows Settings → Privacy & Security → Location</li>
              <li>Pastikan &quot;Location services&quot; ON</li>
              <li>Scroll ke bawah, cari Chrome/Edge Anda, pastikan ON</li>
            </ol>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-900">Langkah 3: Reset & Refresh</p>
            <ol className="ml-2 list-inside list-decimal space-y-1">
              <li>
                Klik ikon gembok → &quot;Reset permission&quot; atau &quot;Site settings&quot;
              </li>
              <li>Set Location ke &quot;Allow&quot;</li>
              <li>
                <strong>Refresh halaman (F5)</strong>
              </li>
              <li>Klik &quot;Allow&quot; jika ada popup</li>
            </ol>
          </div>

          <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-yellow-800">
              <strong>Tips:</strong> Jika masih gagal, coba:
            </p>
            <ul className="mt-1 list-inside list-disc text-yellow-700">
              <li>Tutup browser dan buka lagi</li>
              <li>
                Buka di tab baru: <code>chrome://settings/content/location</code>
              </li>
              <li>Hapus localhost dari blocked list</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
