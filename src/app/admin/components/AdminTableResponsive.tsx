'use client';

import { ReactNode, useState, useEffect } from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: any) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface AdminTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

export default function AdminTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortKey,
  sortDirection,
  className = ''
}: AdminTableProps) {
  const [isMobileView, setIsMobileView] = useState(false);

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  // Check if we should show mobile view
  const checkMobileView = () => {
    if (typeof window !== 'undefined') {
      setIsMobileView(window.innerWidth < 768);
    }
  };

  useEffect(() => {
    // Initialize on mount
    checkMobileView();

    if (typeof window === 'undefined') return;

    const handleResize = () => {
      checkMobileView();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Filter columns based on mobile view
  const visibleColumns = isMobileView 
    ? columns.filter(col => !col.hideOnMobile && col.priority !== 'low')
    : columns;

  if (loading) {
    return null;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Mobile Card View
  if (isMobileView) {
    return (
      <div className={`space-y-4 ${className}`} role="region" aria-label="Data table">
        {data.map((item, index) => (
          <div key={item.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="space-y-3">
              {visibleColumns.map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500 capitalize">
                    {column.label}:
                  </span>
                  <div className="text-sm text-gray-900 text-right max-w-[60%]">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Data table">
          <thead className="bg-gray-50">
            <tr role="row">
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  role="columnheader"
                  className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
                  } ${column.className || ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  tabIndex={column.sortable ? 0 : -1}
                  onKeyDown={column.sortable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort(column.key);
                    }
                  } : undefined}
                  aria-sort={
                    column.sortable
                      ? sortKey === column.key
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col" aria-hidden="true">
                        <svg
                          className={`w-3 h-3 ${
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg
                          className={`w-3 h-3 ${
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr 
                key={item.id || index} 
                role="row"
                className="hover:bg-gray-50 focus-within:bg-gray-50"
                tabIndex={0}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.key}
                    role="cell"
                    className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
