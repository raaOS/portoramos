'use client';

import React from 'react';

interface UploadVariantProps {
  disabled: boolean;
  isDragOver: boolean;
  accept: string;
  multiple: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadCompactVariant({
  disabled,
  isDragOver,
  accept,
  multiple,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onFileInput,
}: UploadVariantProps) {
  return (
    <div
      className={`relative flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-center transition-colors ${
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : 'hover:border-slate-350 border-slate-200 dark:border-slate-800 dark:hover:border-slate-700'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'} `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Upload File"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onFileInput}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {isDragOver ? 'Drop file' : 'Upload File'}
        </span>
      </div>
    </div>
  );
}

export function UploadButtonVariant({
  disabled,
  accept,
  multiple,
  fileInputRef,
  onClick,
  onFileInput,
}: Omit<UploadVariantProps, 'isDragOver' | 'onDragOver' | 'onDragLeave' | 'onDrop'>) {
  return (
    <button
      type="button"
      className={`text-slate-550 dark:hover:bg-slate-850 hover:border-slate-350 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      onClick={onClick}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Upload File"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onFileInput}
        className="hidden"
        disabled={disabled}
      />
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    </button>
  );
}
