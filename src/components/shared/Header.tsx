"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Wifi, Eye } from 'lucide-react';

import { AboutData } from '@/types/about';

export default function Header() {
  const pathname = usePathname();
  const [availability, setAvailability] = useState<AboutData['hero']['availability']>(undefined);
  const [time, setTime] = useState(new Date());

  // Update time for the clock
  useEffect(() => {
    // Determine initial time (Hydration safe)
    setTime(new Date());

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch availability status
  useEffect(() => {
    fetch('/api/about')
      .then(res => res.json())
      .then((data: AboutData) => {
        if (data?.hero?.availability) {
          setAvailability(data.hero.availability);
        }
      })
      .catch(err => console.error('Failed to fetch availability:', err));
  }, []);

  // Format Time & Date
  const formattedTime = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // Determine "App Name" based on route
  const getAppName = () => {
    if (pathname === '/') return 'Portofolio';
    if (pathname?.startsWith('/works')) return 'Works';
    if (pathname?.startsWith('/contact')) return 'Contact';
    if (pathname?.startsWith('/about')) return 'About';
    return 'Finder';
  };

  const appName = getAppName();

  return (
    <header className="fixed top-0 left-0 right-0 h-8 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 z-[100] text-black text-xs select-none shadow-sm border-b border-gray-200">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center hover:bg-black/5 px-2 py-1 rounded cursor-pointer transition-colors pb-1.5" aria-label="Home">
          {/* Authentic Apple Logo Style */}
          <svg width="15" height="18" viewBox="0 0 17 20" fill="black" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6661 17.6533C10.7495 18.9959 9.68947 19.9572 8.52947 20C7.61613 20 7.18947 19.6826 6.32947 19.6826C5.4628 19.6826 4.9628 19.6826 4.09613 20C3.0028 19.9714 2.05613 18.9959 1.15613 17.1666C-0.650534 13.9166 -0.563868 8.64731 2.76947 6.84865C3.8428 6.27398 4.71613 6.13131 5.5628 6.13131C6.55613 6.13131 7.22947 6.74465 8.16947 6.74465C9.09613 6.74465 9.77613 5.96598 10.9561 6.13131C11.5161 6.17398 13.0695 6.36065 14.1228 7.89398C14.0761 7.94731 12.0361 9.13131 12.0761 11.5313C12.1161 14.3473 14.5428 15.3087 14.5961 15.3487C14.5828 15.394 14.2295 16.642 13.5628 17.6133L11.6661 17.6533ZM11.1361 4.10065C11.5961 3.52598 11.9161 2.75931 11.8228 1.95665C11.0828 2.02865 10.1961 2.45798 9.66947 3.09798C9.17613 3.65798 8.7628 4.45798 8.87613 5.23131C9.69613 5.29531 10.5561 4.79398 11.1361 4.10065Z" />
          </svg>
        </Link>

        <div className="font-bold cursor-default px-2 py-1 hidden sm:block">
          {appName}
        </div>

        {/* Menus (Nav Links Disguised as Menus) */}
        <nav className="hidden md:flex items-center gap-1 font-medium">
          <Link href="/" className="px-3 py-1 hover:bg-black/5 rounded cursor-pointer transition-colors">Works</Link>
          <Link href="/about" className="px-3 py-1 hover:bg-black/5 rounded cursor-pointer transition-colors">About</Link>
          <Link href="/contact" className="px-3 py-1 hover:bg-black/5 rounded cursor-pointer transition-colors">Contact</Link>
          <Link href="/cv" className="px-3 py-1 hover:bg-black/5 rounded cursor-pointer transition-colors">Resume</Link>
        </nav>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Availability Status */}
        {availability && (
          <div className={`hidden md:flex items-center gap-2 px-2 py-0.5 rounded-full transition-colors ${availability.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${availability.status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`} />
            <span className="font-medium text-[10px] tracking-wide uppercase">{availability.text}</span>
          </div>
        )}

        {/* Icons */}
        <div className="flex items-center gap-3">
          <Search size={14} className="cursor-pointer hover:text-gray-600" />
          <Wifi size={14} className="cursor-pointer hover:text-gray-600" />

          {/* Battery */}
          <div className="flex items-center gap-[1px] cursor-pointer" title="Battery Full (100%)">
            <div className="w-[22px] h-[11px] bg-[#22c55e] rounded-[2.5px] border border-[#16a34a] flex items-center justify-center shadow-sm">
              <span className="text-[7px] font-bold text-white leading-none pt-[0.5px]">100</span>
            </div>
            <div className="w-[1.5px] h-[3.5px] bg-[#16a34a] rounded-r-[1px] opacity-80" />
          </div>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 font-medium cursor-default min-w-[80px] justify-end">
          <span className="hidden sm:inline">{formattedDate}</span>
          <span>{formattedTime}</span>
        </div>
      </div>
    </header>
  );
}
