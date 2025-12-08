import React from 'react';
import { CheckCircle2, Clock4 } from 'lucide-react';

interface StatusToggleProps {
    isActive: boolean;
    onClick: (e?: React.MouseEvent) => void;
    className?: string;
    labelActive?: string;
    labelInactive?: string;
}

export default function StatusToggle({
    isActive,
    onClick,
    className = '',
    labelActive = 'Active',
    labelInactive = 'Off'
}: StatusToggleProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors border ${isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                } ${className}`}
        >
            {isActive ? (
                <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {labelActive}
                </>
            ) : (
                <>
                    <Clock4 className="w-3.5 h-3.5" /> {labelInactive}
                </>
            )}
        </button>
    );
}
