'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export interface TelegramConfig {
    botToken: string;
    chatId: string;
    isCustom: boolean;
}

export interface BotStatus {
    ok: boolean;
    username?: string;
    firstName?: string;
    error?: string;
}

export interface TestResult {
    success: boolean;
    message: string;
}

export function useTelegramConfig() {
    const { csrfToken } = useAdminAuth();
    
    // State for the ACTIVE (saved) configuration
    const [activeConfig, setActiveConfig] = useState<TelegramConfig | null>(null);
    
    // State for the FORM (input) configuration
    const [formConfig, setFormConfig] = useState<{ botToken: string; chatId: string }>({ 
        botToken: '', 
        chatId: '' 
    });

    const [status, setStatus] = useState<BotStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);

    // Webhook State
    const [webhookInfo, setWebhookInfo] = useState<{ url?: string } | null>(null);
    const [webhookLoading, setWebhookLoading] = useState(false);

    // UI States for Active Card toggles
    const [showToken, setShowToken] = useState(false);
    const [showChatId, setShowChatId] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedChatId, setCopiedChatId] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/telegram/config');
            if (res.ok) {
                const data = await res.json();
                if (data && (data.botToken || data.chatId)) {
                    setActiveConfig(data);
                }
            }
        } catch (_error) {
            console.error('Failed to load config', _error);
        } finally {
            setLoading(false);
        }
    }, []);

    const checkStatus = useCallback(async (_token?: string) => {
        try {
            const res = await fetch('/api/admin/telegram/status');
            const data = await res.json();
            setStatus(data);
        } catch {
            setStatus({ ok: false, error: 'Connection failed' });
        }
    }, []);

    const checkWebhook = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/telegram/webhook');
            const data = await res.json();
            if (data.ok) {
                setWebhookInfo(data.result);
            }
        } catch (_e) {
            console.error('Webhook check failed', _e);
        }
    }, []);

    const handleSetWebhook = async () => {
        setWebhookLoading(true);
        try {
            const url = window.location.origin;
            const res = await fetch('/api/admin/telegram/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (data.ok) {
                alert('Webhook connected successfully!');
                await checkWebhook();
            } else {
                alert(`Failed: ${data.description}`);
            }
        } catch {
            alert('Error setting webhook');
        } finally {
            setWebhookLoading(false);
        }
    };

    const handleDeleteWebhook = async () => {
        if (!confirm('Are you sure you want to disconnect the webhook? The bot will stop replying.')) return;
        setWebhookLoading(true);
        try {
            const res = await fetch('/api/admin/telegram/webhook', {
                method: 'DELETE',
                headers: { 'x-csrf-token': csrfToken },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                alert('Webhook disconnected.');
                await checkWebhook();
            }
        } catch {
            alert('Error deleting webhook');
        } finally {
            setWebhookLoading(false);
        }
    };

    const handleTestPing = async () => {
        if (!activeConfig) return;

        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/telegram/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(activeConfig)
            });
            const data = await res.json();
            setTestResult({
                success: res.ok,
                message: data.message || (res.ok ? 'Ping successful! Check your Telegram.' : 'Ping failed.')
            });
        } catch {
            setTestResult({ success: false, message: 'Network error during test.' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/telegram/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(formConfig)
            });

            if (res.ok) {
                await fetchConfig();
                setFormConfig({ botToken: '', chatId: '' });
                alert('Success! New bot configuration activated.');
            } else {
                alert('Failed to save configuration.');
            }
        } catch {
            alert('Error saving configuration.');
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Initial load
    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Check status when active config changes
    useEffect(() => {
        if (activeConfig?.botToken) {
            checkStatus(activeConfig.botToken);
            checkWebhook();
        }
    }, [activeConfig, checkStatus, checkWebhook]);

    return {
        // State
        activeConfig,
        formConfig,
        setFormConfig,
        status,
        loading,
        testing,
        saving,
        testResult,
        webhookInfo,
        webhookLoading,
        showToken,
        setShowToken,
        showChatId,
        setShowChatId,
        copiedToken,
        setCopiedToken,
        copiedChatId,
        setCopiedChatId,
        // Actions
        fetchConfig,
        checkStatus,
        checkWebhook,
        handleSetWebhook,
        handleDeleteWebhook,
        handleTestPing,
        handleSave,
        copyToClipboard
    };
}
