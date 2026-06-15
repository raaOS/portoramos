'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, List, Clock, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityLogModal({ isOpen, onClose }: ActivityLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      void fetchLogs();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchLogs, isOpen]);

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMetadata = (metadata?: Record<string, unknown>) => {
    if (!metadata) return [];
    return Object.entries(metadata)
      .filter(([key]) => !['userAgent'].includes(key))
      .slice(0, 6)
      .map(([key, value]) => {
        const displayValue =
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
            ? String(value)
            : JSON.stringify(value);
        return `${key}: ${displayValue}`;
      });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="animate-in fade-in zoom-in-95 flex max-h-[min(76dvh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <List size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Log Aktivitas</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 overflow-y-auto bg-gray-50/30 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Activity className="mb-4 h-8 w-8 animate-pulse text-indigo-400" />
              <p className="text-sm text-gray-500">Memuat log aktivitas...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada aktivitas yang dicatat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    </div>
                    {/* Hide line for the last item */}
                    {index !== logs.length - 1 && <div className="mt-2 h-full w-px bg-gray-200" />}
                  </div>
                  <div className="mb-2 flex-1 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">{log.action}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    {formatMetadata(log.metadata).length > 0 ? (
                      <div className="mt-3 space-y-1 rounded-lg bg-gray-50 px-3 py-2">
                        {formatMetadata(log.metadata).map((item) => (
                          <div key={item} className="truncate text-[11px] text-gray-500">
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
