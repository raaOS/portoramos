'use client';

import React from 'react';

interface AdminTrafficLightsProps {
  isMaximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

export function AdminTrafficLights({
  isMaximized,
  onClose,
  onMinimize,
  onToggleMaximize,
}: AdminTrafficLightsProps) {
  return (
    <div className="admin-window-buttons group">
      <button
        className="admin-window-btn admin-window-btn-close"
        style={{
          width: 12,
          height: 12,
          minWidth: 12,
          minHeight: 12,
          padding: 0,
          border: '1px solid #e0443e',
          background: '#ff5f57',
          borderRadius: '9999px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'transparent',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Tutup"
      >
        <svg
          viewBox="0 0 12 12"
          width={8}
          height={8}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'rgba(0,0,0,0.6)' }}
        >
          <path
            d="M3.5 3.5l5 5M8.5 3.5l-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        className="admin-window-btn admin-window-btn-minimize"
        style={{
          width: 12,
          height: 12,
          minWidth: 12,
          minHeight: 12,
          padding: 0,
          border: '1px solid #dda335',
          background: '#febc2e',
          borderRadius: '9999px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'transparent',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        title="Minimize"
      >
        <svg
          viewBox="0 0 12 12"
          width={8}
          height={8}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'rgba(0,0,0,0.6)' }}
        >
          <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <button
        className="admin-window-btn admin-window-btn-maximize"
        style={{
          width: 12,
          height: 12,
          minWidth: 12,
          minHeight: 12,
          padding: 0,
          border: '1px solid #22aa32',
          background: '#28c840',
          borderRadius: '9999px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'transparent',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleMaximize();
        }}
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        <svg
          viewBox="0 0 12 12"
          width={8}
          height={8}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'rgba(0,0,0,0.6)' }}
        >
          {isMaximized ? (
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ) : (
            <>
              <path
                d="M2 4.5L6 2l4 2.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 7.5L6 10l4-2.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
