'use client';

import { Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { BotStatus, TestResult } from '../hooks';

interface BotStatusCardProps {
    status: BotStatus | null;
    loading: boolean;
    testing: boolean;
    testResult: TestResult | null;
    activeConfig: { botToken: string } | null;
    onRefresh: () => void;
    onTestPing: () => void;
}

export function BotStatusCard({
    status,
    loading,
    testing,
    testResult,
    activeConfig,
    onRefresh,
    onTestPing
}: BotStatusCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Bot Status</h3>
                <button
                    onClick={onTestPing}
                    disabled={testing || !activeConfig}
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
                        onClick={onRefresh}
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
            </div>
        </div>
    );
}
