"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { SkipLink } from '@/components/ui/SkipLink'
import { useLastUpdated } from '@/contexts/LastUpdatedContext'

export default function Header() {
  const pathname = usePathname();
  const { lastUpdated } = useLastUpdated();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Works', href: '/works' },
    { name: 'Contact', href: '/contact' },
  ];

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

          {/* Desktop Navigation - Removed as per user request */}
          <div className="hidden md:block" />

          {/* Right Side: Last Updated (Desktop) & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Last Updated - Hidden on mobile to save space */}
            <motion.div
              className="hidden md:flex text-xs text-gray-500 items-center gap-3"
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

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100"
            >
              <nav className="container py-4 flex flex-col gap-4">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-base font-medium px-2 py-1 rounded-md transition-colors ${pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* Mobile CV Button */}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <Link
                    href="/cv?mode=ats"
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700 transition-colors"
                  >
                    CV versi ATS
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
