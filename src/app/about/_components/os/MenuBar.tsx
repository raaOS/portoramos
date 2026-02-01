"use client";

import React, { useState, useEffect } from "react";
import { Search, Wifi, Battery, Command } from "lucide-react";

interface MenuBarProps {
    onSearch?: () => void;
    activeWindow?: string;
    onAbout?: () => void;
    availability?: {
        status: string;
        text: string;
    };
}

export default function MenuBar({ onSearch, activeWindow = "Finder", onAbout, availability }: MenuBarProps) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format: "Sen 22 Jan 19:30"
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

    return (
        <div className="fixed top-0 left-0 right-0 h-8 bg-white flex items-center justify-between px-4 z-[10000] text-black text-xs select-none shadow-sm border-b border-gray-200">
            {/* Left Side */}
            <div className="flex items-center gap-4">
                <div className="flex items-center hover:bg-black/5 px-2 py-1 rounded cursor-pointer transition-colors pb-1.5">
                    {/* Authentic Apple Logo */}
                    <svg width="15" height="18" viewBox="0 0 17 20" fill="black" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6661 17.6533C10.7495 18.9959 9.68947 19.9572 8.52947 20C7.61613 20 7.18947 19.6826 6.32947 19.6826C5.4628 19.6826 4.9628 19.6826 4.09613 20C3.0028 19.9714 2.05613 18.9959 1.15613 17.1666C-0.650534 13.9166 -0.563868 8.64731 2.76947 6.84865C3.8428 6.27398 4.71613 6.13131 5.5628 6.13131C6.55613 6.13131 7.22947 6.74465 8.16947 6.74465C9.09613 6.74465 9.77613 5.96598 10.9561 6.13131C11.5161 6.17398 13.0695 6.36065 14.1228 7.89398C14.0761 7.94731 12.0361 9.13131 12.0761 11.5313C12.1161 14.3473 14.5428 15.3087 14.5961 15.3487C14.5828 15.394 14.2295 16.642 13.5628 17.6133L11.6661 17.6533ZM11.1361 4.10065C11.5961 3.52598 11.9161 2.75931 11.8228 1.95665C11.0828 2.02865 10.1961 2.45798 9.66947 3.09798C9.17613 3.65798 8.7628 4.45798 8.87613 5.23131C9.69613 5.29531 10.5561 4.79398 11.1361 4.10065Z" />
                    </svg>
                </div>
                <div
                    className="font-bold cursor-pointer hover:bg-black/5 px-2 py-1 rounded transition-colors hidden sm:block"
                    onClick={onAbout}
                >
                    {activeWindow}
                </div>
                {/* Menus (Hidden on mobile for simplicity) */}
                <div className="hidden md:flex items-center gap-1 font-medium">
                    {["File", "Edit", "View", "Go", "Window", "Help"].map((menu) => (
                        <div key={menu} className="px-3 py-1 hover:bg-black/5 rounded cursor-default transition-colors">
                            {menu}
                        </div>
                    ))}
                </div>
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
                    <Search
                        size={14}
                        className="cursor-pointer hover:text-gray-600"
                        onClick={onSearch}
                    />
                    <Wifi size={14} className="cursor-pointer hover:text-gray-600" />

                    {/* Custom Battery 100% Green */}
                    <div className="flex items-center gap-[1px] cursor-pointer" title="Battery Full (100%)" aria-label="Battery 100%">
                        <div className="w-[22px] h-[11px] bg-[#22c55e] rounded-[2.5px] border border-[#16a34a] flex items-center justify-center shadow-sm">
                            <span className="text-[7px] font-bold text-black leading-none pt-[0.5px]" aria-hidden="true">100</span>
                        </div>
                        <div className="w-[1.5px] h-[3.5px] bg-[#16a34a] rounded-r-[1px] opacity-80" />
                    </div>
                </div>

                {/* Clock */}
                <div className="flex items-center gap-2 font-medium cursor-default">
                    <span className="hidden sm:inline">{formattedDate}</span>
                    <span>{formattedTime}</span>
                </div>
            </div>
        </div>
    );
}
