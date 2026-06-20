import React from 'react';
import { CheckCircle2, Clock4 } from 'lucide-react';

interface StatusToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
  labelActive?: string;
  labelInactive?: string;
  iconActive?: React.ReactNode;
  iconInactive?: React.ReactNode;
  variant?: 'default' | 'clean';
}

export default function StatusToggle({
  isActive,
  onClick,
  className = '',
  labelActive,
  labelInactive,
  iconActive,
  iconInactive,
  variant = 'default',
  title,
  ...props
}: StatusToggleProps) {
  const isClean = variant === 'clean';

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        title !== undefined
          ? title
          : isActive
            ? labelActive || 'Active'
            : labelInactive || 'Inactive'
      }
      className={
        isClean
          ? `inline-flex items-center justify-center transition-colors ${
              isActive
                ? 'text-emerald-600 hover:text-emerald-500'
                : 'text-gray-400 hover:text-gray-500'
            } ${className}`
          : `inline-flex items-center justify-center rounded-lg border p-2 transition-colors ${
              isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
            } ${className}`
      }
      {...props}
    >
      {isActive ? (
        <>
          {iconActive || <CheckCircle2 className="h-4 w-4" />}
          {labelActive && <span className="ml-1.5 text-xs font-medium">{labelActive}</span>}
        </>
      ) : (
        <>
          {iconInactive || <Clock4 className="h-4 w-4" />}
          {labelInactive && <span className="ml-1.5 text-xs font-medium">{labelInactive}</span>}
        </>
      )}
    </button>
  );
}
