'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

import { useModal } from '@/contexts/ModalContext';

const itemsBase = [
  { href: '/', label: 'Works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function FloatingNav() {
  const pathname = usePathname();

  const { isModalOpen } = useModal();
  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    setIsAdminPage(pathname?.startsWith('/admin') ?? false);
  }, [pathname]);

  // Hanya tampilkan di halaman non-admin dan saat modal tidak terbuka
  if (isAdminPage || isModalOpen) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
      className="fixed bottom-8 inset-x-0 z-[9999] flex justify-center pointer-events-auto"
    >
      <div className="bg-white/80 backdrop-blur-md border border-black/20 rounded-full px-4 py-3">
        <ul className="flex items-center gap-2">
          {itemsBase.map((it) => {
            const active = it.href === '/' ? pathname === '/' : pathname?.startsWith(it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={clsx(
                    'inline-flex items-center h-10 md:h-11 px-5 md:px-6 text-sm md:text-base rounded-full transition-all text-gray-900',
                    active 
                      ? 'bg-black text-white scale-105' 
                      : 'hover:bg-black/5'
                  )}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.nav>
  );
}