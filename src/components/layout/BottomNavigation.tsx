'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { name: 'Works', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isNavbarVisible } = useNavbarVisibility();

  // Clean, simple state derivation - no effects needed
  // We can just trust pathname for the active state
  // But to keep the "immediate click" feedback we keep local state
  const [activeIndex, setActiveIndex] = useState(() => {
    const currentIndex = NAV_ITEMS.findIndex(item => item.href === pathname);
    return currentIndex !== -1 ? currentIndex : 0;
  });

  // Sync state with pathname safely
  useEffect(() => {
    const currentIndex = NAV_ITEMS.findIndex(item => item.href === pathname);

    setActiveIndex(prev => {
      if (currentIndex !== -1 && currentIndex !== prev) {
        return currentIndex;
      } else if (currentIndex === -1 && prev !== 0) {
        return 0;
      }
      return prev;
    });
  }, [pathname]);

  const handleNavigation = (href: string, index: number) => {
    if (pathname === href) return;
    if (navigator.vibrate) navigator.vibrate(30);

    setActiveIndex(index);
    router.push(href);
  };

  if (!isNavbarVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pb-6 px-4 pointer-events-none print:hidden" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
      <div className="pointer-events-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-full p-1.5 shadow-2xl mx-auto max-w-sm">
        <div className="flex items-center space-x-1 relative">

          {NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, index)}
                className={`
                  relative px-5 py-3 rounded-full font-medium text-sm transition-all duration-200
                  flex items-center justify-center min-w-[70px] z-10
                  ${isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }
                `}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span className="relative z-20">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
