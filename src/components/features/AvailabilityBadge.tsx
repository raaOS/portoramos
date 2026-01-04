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
            containerStyle: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
            defaultText: 'Available for Work'
        },
        booked: {
            color: 'bg-red-500',
            glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
            containerStyle: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
            defaultText: 'Fully Booked'
        },
        limited: {
            color: 'bg-yellow-500',
            glow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
            containerStyle: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
            defaultText: 'Limited Availability'
        }
    };

    const current = config[status] || config.available;
    const label = text || current.defaultText;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border ${current.containerStyle} ${className}`}>
            <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.color}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${current.color} ${current.glow}`}></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase">
                {label}
            </span>
        </div>
    );
}
