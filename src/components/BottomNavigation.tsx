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
      <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-black rounded-full px-2 py-2 shadow-lg">
        <div className="flex items-center space-x-3">
          {NAV_ITEMS.map((item, index) => {
            const isActive = pathname === item.href;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href, index)}
                className={`
                  relative px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ease-out
                  flex items-center justify-center min-w-[80px] group
                  ${isActive
                    ? 'bg-blue-600 text-white scale-105'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105'
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
