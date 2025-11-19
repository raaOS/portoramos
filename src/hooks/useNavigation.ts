'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback((href: string) => {
    if (pathname === href) return;
    
    setIsNavigating(true);
    router.push(href);
    
    // Reset navigation state immediately
    setIsNavigating(false);
  }, [router, pathname]);

  const navigateWithScroll = useCallback((href: string) => {
    if (pathname === href) return;
    
    setIsNavigating(true);
    router.push(href);
    
    // Reset navigation state immediately
    setIsNavigating(false);
  }, [router, pathname]);

  return {
    navigate,
    navigateWithScroll,
    isNavigating,
    pathname
  };
}
