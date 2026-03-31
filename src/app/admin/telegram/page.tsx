'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function TelegramAdminPage() {
  const [status, setStatus] = useState<{
    isCorrect?: boolean;
    telegram?: { url?: string; pending_update_count?: number };
    currentConfig?: { expectedWebhookUrl?: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { isAdmin, csrfToken, isLoading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/admin/login';
    }
  }, [isAdmin, authLoading]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug/webhook-status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setMessage(`Error checking status: ${(error as Error).message}`);
    }
    setLoading(false);
  };

  const fixWebhook = async () => {
    if (!csrfToken) {
      setMessage('CSRF token not available. Please login again.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/debug/webhook-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        setMessage('Webhook fixed successfully.');
        checkStatus();
      } else {
        setMessage(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
    setLoading(false);
  };

  const clearPending = async () => {
    if (!csrfToken) {
      setMessage('CSRF token not available. Please login again.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/telegram/webhook?drop_pending_updates=true', {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken
        },
        credentials: 'include'
      });
      const data = await res.json();

      if (data.ok) {
        setMessage('Pending updates cleared.');
      } else {
        setMessage(`Failed to clear: ${data.description || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Telegram Bot Admin</h1>

        {message && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              message.toLowerCase().includes('success') || message.toLowerCase().includes('cleared')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Webhook Status</h2>

          {status ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current URL:</span>
                <span className={`font-mono text-sm ${status.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {status.telegram?.url || 'NOT SET'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected URL:</span>
                <span className="font-mono text-sm text-blue-600">
                  {status.currentConfig?.expectedWebhookUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={status.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {status.isCorrect ? 'CORRECT' : 'WRONG URL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Updates:</span>
                <span className={(status.telegram?.pending_update_count ?? 0) > 0 ? 'text-orange-600 font-semibold' : 'text-gray-800'}>
                  {status.telegram?.pending_update_count || 0}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading...</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={fixWebhook}
              disabled={loading || status?.isCorrect}
              className={`w-full py-3 px-4 rounded-lg font-semibold ${
                status?.isCorrect
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Processing...' : status?.isCorrect ? 'Webhook already correct' : 'Fix Webhook URL'}
            </button>

            {(status?.telegram?.pending_update_count ?? 0) > 0 && (
              <button
                onClick={clearPending}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white"
              >
                Clear {status?.telegram?.pending_update_count ?? 0} Pending Updates
              </button>
            )}

            <button
              onClick={checkStatus}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Refresh Status
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Use "Fix Webhook URL" if the current URL does not match the expected endpoint.</li>
            <li>Use "Clear Pending Updates" if Telegram messages are stuck in the queue.</li>
            <li>Refresh status after changes to confirm the bot is healthy.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
