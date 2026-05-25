import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminLoadingProps {
  /** Pesan yang muncul di samping spinner. Default "Memuat data". */
  label?: string;
  /**
   * Ukuran preset:
   *  - inline: untuk loading inline di card kecil (py-6, ikon 16px)
   *  - default: untuk loading section (py-12, ikon 20px)
   *  - page: untuk full-page loading state (py-24, ikon 24px)
   */
  size?: 'inline' | 'default' | 'page';
  /** Override className container kalau perlu posisi custom */
  className?: string;
}

const sizeMap = {
  inline: { wrapper: 'py-6', icon: 'w-4 h-4', text: 'text-sm' },
  default: { wrapper: 'py-12', icon: 'w-5 h-5', text: 'text-sm' },
  page: { wrapper: 'py-24', icon: 'w-6 h-6', text: 'text-base' },
} as const;

/**
 * Shared admin loading state.
 *
 * Sebelumnya admin pages render spinner border-css yang tampil patah-patah
 * ('animate-spin border-b-2 border-blue-600'). Penyebabnya: hanya satu sisi
 * border yang punya warna, jadi mata melihat "C" yang berputar dengan jeda
 * visual. Komponen ini ganti pakai Loader2 dari lucide-react (4 segmen
 * gradient continuous) + dot pulse untuk teks supaya feel-nya lebih halus.
 */
export default function AdminLoading({
  label = 'Memuat data',
  size = 'default',
  className = '',
}: AdminLoadingProps) {
  const cls = sizeMap[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 text-gray-500 ${cls.wrapper} ${className}`}
    >
      <Loader2 className={`${cls.icon} animate-spin text-gray-400`} aria-hidden="true" />
      <span className={`${cls.text} font-medium tracking-tight`}>
        {label}
        <LoadingDots />
      </span>
    </div>
  );
}

/**
 * Tiga titik yang fade in/out bergantian. Pakai inline-block + style
 * animation-delay supaya tidak butuh @keyframes baru — pakai
 * `animate-pulse` Tailwind dengan delay shift via inline style.
 */
function LoadingDots() {
  return (
    <span className="ml-0.5 inline-flex" aria-hidden="true">
      <span className="animate-pulse" style={{ animationDelay: '0ms' }}>
        .
      </span>
      <span className="animate-pulse" style={{ animationDelay: '150ms' }}>
        .
      </span>
      <span className="animate-pulse" style={{ animationDelay: '300ms' }}>
        .
      </span>
    </span>
  );
}
