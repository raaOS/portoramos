'use client';

import { ReactNode } from 'react';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  tone?: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose' | 'slate';
}

export default function AdminCard({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  actions,
  loading = false,
  icon,
  tone = 'slate'
}: AdminCardProps) {
  const toneClass: Record<NonNullable<AdminCardProps['tone']>, string> = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {icon && (
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneClass[tone]} shadow-sm`}>
                  {icon}
                </span>
              )}
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-6">
        {loading ? null : children}
      </div>
    </div>
  );
}
