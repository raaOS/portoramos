import React, { useState, useEffect } from 'react';
import { Cloud, Sun, Music, SkipForward, Play, Pause, Thermometer } from 'lucide-react';
import { motion } from 'framer-motion';

const WidgetCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-lg text-white ${className}`}>
        {children}
    </div>
);

const ClockWidget = () => {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null;

    return (
        <WidgetCard className="flex flex-col items-center justify-center min-w-[160px]">
            <span className="text-4xl font-bold tracking-tighter shadow-black/10 drop-shadow-md">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs uppercase tracking-widest opacity-80 mt-1 font-medium">
                {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
        </WidgetCard>
    );
}

const WeatherWidget = () => {
    // Simulated weather
    return (
        <WidgetCard className="flex items-center gap-3 min-w-[160px]">
            <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 p-2 rounded-full shadow-lg">
                <Sun size={24} className="text-white fill-white/50" />
            </div>
            <div>
                <div className="text-2xl font-bold">32°</div>
                <div className="text-[10px] uppercase opacity-70">Jakarta, Sunny</div>
            </div>
        </WidgetCard>
    );
}

const SpotifyWidget = () => {
    const [isPlaying, setIsPlaying] = useState(true);

    return (
        <WidgetCard className="p-0 overflow-hidden w-[360px] flex items-center pr-4">
            {/* Vinyl Record */}
            <div className="relative shrink-0 p-3">
                <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                    className="w-24 h-24 rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-xl flex items-center justify-center relative overflow-hidden"
                >
                    {/* Vinyl Grooves Effect */}
                    <div className="absolute inset-0 rounded-full border-[10px] border-neutral-800/40" />
                    <div className="absolute inset-0 rounded-full border-[20px] border-neutral-800/20" />

                    {/* Album Art (Center Label) */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-10 relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
                    </div>
                </motion.div>

                {/* Tonearm (Decorative) */}
                <div className="absolute top-2 right-2 w-12 h-16 pointer-events-none opacity-80 mix-blend-multiply">
                    <div className={`w-1 h-12 bg-neutral-400 absolute right-4 top-0 origin-top transition-transform duration-500 ${isPlaying ? 'rotate-[20deg]' : 'rotate-[-10deg]'}`} />
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-3 pl-1">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-[10px] uppercase text-pink-400 font-bold tracking-widest mb-0.5">Now Spinning</div>
                        <div className="font-bold text-sm truncate">Midnight City</div>
                        <div className="text-xs opacity-70 truncate mb-3">M83 - Hurry Up, We're Dreaming</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" className="ml-0.5" />}
                    </button>
                    <button className="text-white/70 hover:text-white transition-colors">
                        <SkipForward size={18} />
                    </button>
                    {/* Fake Progress Bar */}
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden ml-1">
                        <motion.div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 w-[60%]"
                            animate={{ width: isPlaying ? ["60%", "65%"] : "60%" }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                        />
                    </div>
                </div>
            </div>
        </WidgetCard>
    );
};

const StickyNoteWidget = () => {
    return (
        <motion.div
            initial={{ rotate: -2 }}
            whileHover={{ rotate: 0, scale: 1.05 }}
            className="relative w-[180px] bg-[#fef08a] text-neutral-800 p-4 shadow-lg shadow-black/5 rotate-[-2deg] flex flex-col items-center justify-center font-medium"
            style={{
                clipPath: "polygon(0% 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%)" // Folded corner effect
            }}
        >
            {/* Tape Element */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/30 backdrop-blur-sm border border-white/20 rotate-1 shadow-sm" />

            {/* Note Content */}
            <div className="font-[handwriting] text-sm leading-relaxed text-center opacity-90" style={{ fontFamily: 'cursive' }}>
                <span className="font-bold block mb-1">Reminder:</span>
                Don't forget to push to production on Friday! 🚀
            </div>

            {/* Folded Corner Visual (Pseudo-element substitute) */}
            <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-black/10"
                style={{
                    clipPath: "polygon(100% 0, 0 0, 0 100%)"
                }}
            />
        </motion.div>
    );
};

export default function DesktopWidgets() {
    return (
        <div className="fixed top-8 right-8 z-10 flex flex-col gap-4 pointer-events-auto items-end">
            <div className="flex gap-4">
                <ClockWidget />
                <WeatherWidget />
            </div>
            <div className="flex gap-4 items-start">
                <StickyNoteWidget />
                <SpotifyWidget />
            </div>
        </div>
    );
}
