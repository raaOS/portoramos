"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, Eye } from 'lucide-react';

import { SkipLink } from '@/components/ui/SkipLink'
import { useLastUpdated } from '@/contexts/LastUpdatedContext'

import AvailabilityBadge from '@/components/features/AvailabilityBadge';
import { AboutData } from '@/types/about';

export default function Header() {
  const pathname = usePathname();
  const { lastUpdated } = useLastUpdated();
  const [availability, setAvailability] = useState<AboutData['hero']['availability']>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Fetch availability status
    fetch('/api/about')
      .then(res => res.json())
      .then((data: AboutData) => {
        if (data?.hero?.availability) {
          setAvailability(data.hero.availability);
        }
      })
      .catch(err => console.error('Failed to fetch availability:', err));
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);



  return (
    <>
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-40 backdrop-blur transition-colors duration-300 bg-black/95"
        role="banner"
      >
        <div className="max-w-full px-8 flex items-center justify-between py-4 gap-8">
          {/* Logo/Name - Kiri */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 font-medium focus:outline-none rounded-md group"
              aria-label="Go to homepage"
            >
              <motion.span
                className="text-white group-hover:text-blue-400 transition-colors duration-300"
                whileHover={{ x: 2 }}
              >
                Portofolio Ramos
              </motion.span>
            </Link>

            {/* Availability Badge - Fetched Client Side */}
            <AnimatePresence>
              {isClient && availability && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.5 }}
                >
                  <AvailabilityBadge
                    status={availability.status}
                    text={availability.text}
                    className="!py-1 !px-2 scale-90 origin-left"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side: Last Updated (Desktop) & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Last Updated - Hidden on mobile to save space */}
            <motion.div
              className="hidden md:flex text-xs text-gray-300 items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isClient && lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              <Link
                href="/cv?mode=ats"
                className="inline-flex items-center gap-2 rounded-full bg-[#E60023] text-white px-6 py-2 font-semibold transition-all duration-300"
                aria-label="Lihat Resume versi ATS yang ramah screening"
              >
                <Eye className="w-4 h-4" />
                <span>Resume</span>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-blue-400 transition-colors"
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
              className="md:hidden overflow-hidden bg-black border-t border-gray-800"
            >
              <nav className="container py-4 flex flex-col gap-4">

                {/* Mobile CV Button */}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <Link
                    href="/cv?mode=ats"
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-[#E60023] text-white px-6 py-2.5 font-semibold transition-all duration-300"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Resume</span>
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
