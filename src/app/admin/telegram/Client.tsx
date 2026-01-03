'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Save, Eye, EyeOff, Copy, Check, Plus, Shield } from 'lucide-react';

interface TelegramConfig {
    botToken: string;
    chatId: string;
    isCustom: boolean; // true if loaded from json, false if from env
}

interface BotStatus {
    ok: boolean;
    username?: string;
    firstName?: string;
    error?: string;
}

export default function TelegramClient() {
    // State for the ACTIVE (saved) configuration
    const [activeConfig, setActiveConfig] = useState<TelegramConfig | null>(null);

    // State for the FORM (input) configuration
    const [formConfig, setFormConfig] = useState<{ botToken: string; chatId: string }>({ botToken: '', chatId: '' });

    const [status, setStatus] = useState<BotStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // UI States for Active Card toggles
    const [showToken, setShowToken] = useState(false);
    const [showChatId, setShowChatId] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedChatId, setCopiedChatId] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/telegram/config');
            if (res.ok) {
                const data = await res.json();
                // If the response is empty/invalid, activeConfig stays null or default
                if (data && (data.botToken || data.chatId)) {
                    setActiveConfig(data);
                    checkStatus(data.botToken);
                }
            }
        } catch (error) {
            console.error('Failed to load config', error);
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async (token: string) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/admin/telegram/status?token=${encodeURIComponent(token)}`);
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            setStatus({ ok: false, error: 'Connection failed' });
        }
    };

    const handleTestPing = async () => {
        if (!activeConfig) return;

        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/telegram/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activeConfig) // Test the ACTIVE config
            });
            const data = await res.json();
            setTestResult({
                success: res.ok,
                message: data.message || (res.ok ? 'Ping successful! Check your Telegram.' : 'Ping failed.')
            });
        } catch (error) {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formConfig)
            });

            if (res.ok) {
                // Refresh active config logic
                await fetchConfig();
                // Clear the form
                setFormConfig({ botToken: '', chatId: '' });
                alert('Success! New bot configuration activated.');
            } else {
                alert('Failed to save configuration.');
            }
        } catch (error) {
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

    return (
        <AdminLayout
            title="Telegram Command Center"
            subtitle="Manage your bot credentials and test notifications"
            titleIcon={<Send className="w-6 h-6 text-sky-600" />}
            titleAccent="bg-sky-50 text-sky-700"
        >
            <div className="space-y-8 max-w-3xl">

                {/* 1. UPDATE / ADD BOT FORM (TOP) */}
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Plus className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Update / Replace Bot</h3>
                            <p className="text-sm text-gray-500">Enter new credentials below to switch bots. Fields will clear after saving.</p>
                        </div>
                    </div>

                    <div className="grid gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Bot Token</label>
                            <input
                                type="text"
                                value={formConfig.botToken}
                                onChange={(e) => setFormConfig({ ...formConfig, botToken: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                                placeholder="Paste new token here..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Chat ID</label>
                            <input
                                type="text"
                                value={formConfig.chatId}
                                onChange={(e) => setFormConfig({ ...formConfig, chatId: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                                placeholder="Paste new chat ID here..."
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving || !formConfig.botToken || !formConfig.chatId}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition shadow-sm w-full justification-center justify-center sm:w-auto"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save & Activate New Bot'}
                        </button>
                    </div>
                </section>


                {/* 2. ACTIVE CONFIGURATION (BOTTOM) */}
                {activeConfig && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                Active Configuration
                            </h3>
                            {activeConfig.isCustom ? (
                                <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium border border-orange-200">
                                    Custom Override
                                </span>
                            ) : (
                                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium border border-gray-200">
                                    Environment Default
                                </span>
                            )}
                        </div>

                        {/* Status Checker in Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800">Bot Status</h3>
                                <button
                                    onClick={() => handleTestPing()}
                                    disabled={testing}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 disabled:opacity-50 transition text-xs font-medium"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {testing ? 'Pinging...' : 'Test Ping'}
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Bot Identity */}
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full flex-shrink-0 ${status?.ok ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {status?.ok ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-semibold text-gray-900">
                                            {status?.ok ? `Connected as ${status.firstName}` : 'Disconnected'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {status?.ok ? `@${status.username}` : (status?.error || 'Unknown Error')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => checkStatus(activeConfig.botToken)}
                                        disabled={loading}
                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {/* Ping Result */}
                                {testResult && (
                                    <div className={`p-3 rounded-lg text-sm flex items-start gap-3 ${testResult.success ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                                        {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                        <span>{testResult.message}</span>
                                    </div>
                                )}

                                <hr className="border-gray-100" />

                                {/* Read-Only Credentials */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Active Token</label>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                            <code className="flex-1 text-sm font-mono text-gray-700 truncate">
                                                {showToken ? activeConfig.botToken : '••••••••••••••••••••'}
                                            </code>
                                            <button onClick={() => setShowToken(!showToken)} className="p-1 text-gray-400 hover:text-gray-700">
                                                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => copyToClipboard(activeConfig.botToken, setCopiedToken)} className="p-1 text-gray-400 hover:text-sky-600">
                                                {copiedToken ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Active Chat ID</label>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                            <code className="flex-1 text-sm font-mono text-gray-700 truncate">
                                                {showChatId ? activeConfig.chatId : '•••••'}
                                            </code>
                                            <button onClick={() => setShowChatId(!showChatId)} className="p-1 text-gray-400 hover:text-gray-700">
                                                {showChatId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => copyToClipboard(activeConfig.chatId, setCopiedChatId)} className="p-1 text-gray-400 hover:text-sky-600">
                                                {copiedChatId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
