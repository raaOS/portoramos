'use client';

type AvailabilityStatus = 'available' | 'booked' | 'limited';

interface AvailabilityBadgeProps {
    status: AvailabilityStatus;
    text?: string;
    className?: string;
}

export default function AvailabilityBadge({ status, text, className = '' }: AvailabilityBadgeProps) {
    const config = {
        available: {
            color: 'bg-green-500',
            glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
            defaultText: 'Available for Work'
        },
        booked: {
            color: 'bg-red-500',
            glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
            defaultText: 'Fully Booked'
        },
        limited: {
            color: 'bg-yellow-500',
            glow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
            defaultText: 'Limited Availability'
        }
    };

    const current = config[status] || config.available;
    const label = text || current.defaultText;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 ${className}`}>
            <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.color}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${current.color} ${current.glow}`}></span>
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                {label}
            </span>
        </div>
    );
}
