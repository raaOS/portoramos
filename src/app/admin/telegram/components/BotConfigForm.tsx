'use client';

import { Save, Plus } from 'lucide-react';

interface BotConfigFormProps {
    botToken: string;
    chatId: string;
    onBotTokenChange: (value: string) => void;
    onChatIdChange: (value: string) => void;
    onSave: () => void;
    saving: boolean;
}

export function BotConfigForm({
    botToken,
    chatId,
    onBotTokenChange,
    onChatIdChange,
    onSave,
    saving
}: BotConfigFormProps) {
    const canSave = botToken && chatId;

    return (
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
                        value={botToken}
                        onChange={(e) => onBotTokenChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                        placeholder="Paste new token here..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Chat ID</label>
                    <input
                        type="text"
                        value={chatId}
                        onChange={(e) => onChatIdChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                        placeholder="Paste new chat ID here..."
                    />
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={onSave}
                    disabled={saving || !canSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition shadow-sm w-full justify-center sm:w-auto"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save & Activate New Bot'}
                </button>
            </div>
        </section>
    );
}
