import { m } from 'motion/react';

export default function TypingIndicator() {
    return (
        <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="relative flex max-w-[85%] flex-col self-start items-start"
        >
            <div className="relative min-w-[60px] rounded-2xl rounded-tl-none bg-white px-3 py-1.5 text-[#667781] shadow-sm dark:bg-[#202c33] dark:text-[#8696a0]">
                {/* Chat Tail SVG */}
                <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white dark:text-[#202c33] fill-current transform scale-x-[-1] overflow-visible z-20">
                    <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                </svg>

                <div className="flex items-center justify-center gap-1.5 py-1">
                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-[#8696a0]" />
                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[#8696a0]" />
                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-[#8696a0]" />
                </div>
            </div>
        </m.div>
    );
}
