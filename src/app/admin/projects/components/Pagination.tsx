import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`h-10 min-w-[40px] rounded-lg text-sm font-bold transition-all ${
                currentPage === page
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};
