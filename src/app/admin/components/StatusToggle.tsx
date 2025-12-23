import React from 'react';
import { CheckCircle2, Clock4 } from 'lucide-react';

interface StatusToggleProps {
    isActive: boolean;
    onClick: (e?: React.MouseEvent) => void;
    className?: string;
    labelActive?: string;
    labelInactive?: string;
    iconActive?: React.ReactNode;
    iconInactive?: React.ReactNode;
}

export default function StatusToggle({
    isActive,
    onClick,
    className = '',
    labelActive,
    labelInactive,
    iconActive,
    iconInactive
}: StatusToggleProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={isActive ? (labelActive || 'Active') : (labelInactive || 'Inactive')}
            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors border ${isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                } ${className}`}
        >
            {isActive ? (
                <>
                    {iconActive || <CheckCircle2 className="w-4 h-4" />}
                    {labelActive && <span className="ml-1.5 text-xs font-medium">{labelActive}</span>}
                </>
            ) : (
                <>
                    {iconInactive || <Clock4 className="w-4 h-4" />}
                    {labelInactive && <span className="ml-1.5 text-xs font-medium">{labelInactive}</span>}
                </>
            )}
        </button>
    );
}
