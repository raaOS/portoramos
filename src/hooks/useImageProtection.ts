'use client';

import { useCallback, useState, useEffect } from 'react';

/**
 * Image Protection Hook — Mencegah klik kanan pada gambar portfolio.
 *
 * Menampilkan toast lucu saat user mencoba context menu pada gambar.
 * Toast auto-dismiss setelah 2.5 detik.
 *
 * Catatan: Ini hanya pencegahan UX — gambar tetap bisa diakses via DevTools.
 *
 * @module useImageProtection
 *
 * @example
 * ```tsx
 * const { toast, handleContextMenu } = useImageProtection();
 * <img onContextMenu={handleContextMenu} src="..." />
 * {toast && <div>{toast.emoji} {toast.text}</div>}
 * ```
 */

const MESSAGES = [
  { emoji: '😂', text: 'Hayooo ngapain klik kanan?? wkwkwk' },
  { emoji: '👀', text: 'Mau nyolong desain gw ya?? keliatan banget~' },
  { emoji: '🙊', text: 'Eh eh eh, itu desain gw loh! wkwkwk' },
  { emoji: '🤣', text: 'Astaga mau di-save ya?? Respect kreator dong~' },
  { emoji: '😎', text: 'Santai bro, ini dilindungi hak cipta wkwk' },
];

interface UseImageProtectionReturn {
  toast: { emoji: string; text: string } | null;
  handleContextMenu: (e: React.MouseEvent) => void;
}

export function useImageProtection(): UseImageProtectionReturn {
  const [toast, setToast] = useState<{ emoji: string; text: string } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setToast(msg);
  }, []);

  // Auto-dismiss toast setelah 2.5 detik
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, handleContextMenu };
}
