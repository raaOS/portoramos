'use client';

import { useState, useEffect } from 'react';

export default function TelegramAdminPage() {
  const [status, setStatus] = useState<{ isCorrect?: boolean; telegram?: { url?: string; pending_update_count?: number }; currentConfig?: { expectedWebhookUrl?: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug/webhook-status');
      const data = await res.json();
      setStatus(data);
    } catch (_e) {
      setMessage('Error checking status: ' + (_e as Error).message);
    }
    setLoading(false);
  };

  const fixWebhook = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/debug/webhook-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Webhook fixed successfully!');
        checkStatus();
      } else {
        setMessage('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (_e) {
      setMessage('❌ Error: ' + (_e as Error).message);
    }
    setLoading(false);
  };

  const clearPending = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Get bot token from config
      const res = await fetch('/api/admin/telegram/config');
      const config = await res.json();
      
      if (config.configured && config._botToken) {
        const clearRes = await fetch(`https://api.telegram.org/bot${config._botToken}/deleteWebhook?drop_pending_updates=true`);
        const clearData = await clearRes.json();
        if (clearData.ok) {
          setMessage('✅ Pending updates cleared!');
        } else {
          setMessage('❌ Failed to clear: ' + clearData.description);
        }
      }
    } catch (_e) {
      setMessage('❌ Error: ' + (_e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect (cascading renders)
    const timer = setTimeout(() => {
      checkStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Telegram Bot Admin</h1>
        
        {message && (
          <div className={`p-4 rounded-lg mb-4 ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                  {status.isCorrect ? '✅ CORRECT' : '❌ WRONG URL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Updates:</span>
                <span className={status.telegram?.pending_update_count > 0 ? 'text-orange-600 font-semibold' : 'text-gray-800'}>
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
              {loading ? 'Processing...' : status?.isCorrect ? '✅ Webhook Already Correct' : '🔧 Fix Webhook URL'}
            </button>

            {status?.telegram?.pending_update_count > 0 && (
              <button
                onClick={clearPending}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white"
              >
                🧹 Clear {status.telegram.pending_update_count} Pending Updates
              </button>
            )}

            <button
              onClick={checkStatus}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Click &quot;Fix Webhook URL&quot; if status shows ❌ WRONG URL</li>
            <li>Click &quot;Clear Pending Updates&quot; if there are stuck messages</li>
            <li>After fixing, reply from Telegram app should work!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
