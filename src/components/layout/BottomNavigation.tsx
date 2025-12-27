'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { name: 'Works', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isNavbarVisible } = useNavbarVisibility();
  const [activeIndex, setActiveIndex] = useState(0);

  // Update active index when pathname changes
  useEffect(() => {
    const currentIndex = NAV_ITEMS.findIndex(item => item.href === pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    } else {
      setActiveIndex(0);
    }
  }, [pathname]);

  const handleNavigation = (href: string, index: number) => {
    if (pathname === href) return;

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    setActiveIndex(index);
    router.push(href);
  };

  if (!isNavbarVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pb-6 px-4 pointer-events-none print:hidden" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
      <div className="pointer-events-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-full p-1.5 shadow-2xl mx-auto max-w-sm">
        <div className="flex items-center space-x-1">
          {NAV_ITEMS.map((item, index) => {
            const isActive = pathname === item.href;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, index)}
                className={`
                  relative px-5 py-3 rounded-full font-medium text-sm transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                  flex items-center justify-center min-w-[70px]
                  ${isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10 scale-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:scale-100'
                  }
                `}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
