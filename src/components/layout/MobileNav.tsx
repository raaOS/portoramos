'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Works' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  const handleNavigation = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Mobile Menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50"
          >
            <div className="p-6">
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="ml-auto block p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Navigation Items */}
              <nav className="mt-8 space-y-4">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      pathname === item.href 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Creative Agency Style Decoration */}
              <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <p className="text-sm text-gray-500">Creative Portfolio</p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
