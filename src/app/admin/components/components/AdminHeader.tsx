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
  actions,
}: AdminHeaderProps) => {
  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {titleIcon && (
            <div className={`rounded-lg p-2 ${titleAccent} bg-opacity-10`}>{titleIcon}</div>
          )}
          <h1 className="text-xl font-bold leading-tight text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
