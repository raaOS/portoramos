"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { SkipLink } from '@/components/ui/SkipLink'
import { useLastUpdated } from '@/contexts/LastUpdatedContext'

export default function Header() {
  const pathname = usePathname();
  const { lastUpdated } = useLastUpdated();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      
      
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-40 backdrop-blur transition-colors duration-300 bg-white/90 border-b border-gray-200"
        role="banner"
      >
        <div className="container flex items-center justify-between py-4 gap-3">
          {/* Logo/Name - Kiri */}
          <Link
            href="/"
            className="flex items-center gap-3 font-medium focus:outline-none rounded-md group"
            aria-label="Go to homepage"
          >
            <motion.span
              className="text-black group-hover:text-blue-600 transition-colors duration-300"
              whileHover={{ x: 2 }}
            >
              Portofolio Ramos
            </motion.span>
          </Link>

          {/* Last Updated - Kanan */}
          <motion.div
            className="text-xs text-gray-500 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isClient && lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            <Link
              href="/cv?mode=ats"
              className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-3 py-1.5 font-semibold hover:bg-red-700 transition-colors"
              aria-label="Lihat CV versi ATS yang ramah screening"
            >
              CV versi ATS
            </Link>
          </motion.div>
        </div>
      </motion.header>
    </>
  );
}
