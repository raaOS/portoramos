'use client';

import React, { ReactNode } from 'react';

interface AdminHeaderProps {
  title: string;
  titleIcon?: ReactNode;
  titleAccent?: string;
  actions?: ReactNode;
}

export const AdminHeader = ({
  title,
  titleIcon,
  titleAccent = 'bg-blue-50 text-blue-700',
  actions
}: AdminHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {titleIcon && (
            <div className={`p-2 rounded-lg ${titleAccent} bg-opacity-10`}>
              {titleIcon}
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
