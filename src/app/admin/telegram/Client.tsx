'use client';

import { AdminHeader } from '../components/components/AdminHeader';
import { Send } from 'lucide-react';
import { useTelegramConfig } from './hooks';
import {
    BotConfigForm,
    ActiveConfigCard,
    PrivateContactForm
} from './components';

export default function TelegramClient() {
    const {
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
        checkStatus,
        handleSetWebhook,
        handleDeleteWebhook,
        handleTestPing,
        handleSave,
        copyToClipboard
    } = useTelegramConfig();

    return (
        <>
            <AdminHeader
                title="Telegram Command Center"
                titleIcon={<Send className="w-6 h-6 text-sky-600" />}
                titleAccent="bg-sky-50 text-sky-700"
            />
            <div className="p-6 flex-1 space-y-6">
                <div className="space-y-8 max-w-3xl">
                    {/* 1. UPDATE / ADD BOT FORM (TOP) */}
                    <BotConfigForm
                        botToken={formConfig.botToken}
                        chatId={formConfig.chatId}
                        onBotTokenChange={(value) => setFormConfig(prev => ({ ...prev, botToken: value }))}
                        onChatIdChange={(value) => setFormConfig(prev => ({ ...prev, chatId: value }))}
                        onSave={handleSave}
                        saving={saving}
                    />

                    {/* 2. PRIVATE CONTACT INFO (AI RESUME) */}
                    <PrivateContactForm />

                    {/* 3. ACTIVE CONFIGURATION (BOTTOM) */}
                    {activeConfig && (
                        <ActiveConfigCard
                            config={activeConfig}
                            status={status}
                            loading={loading}
                            testing={testing}
                            testResult={testResult}
                            webhookInfo={webhookInfo}
                            webhookLoading={webhookLoading}
                            showToken={showToken}
                            showChatId={showChatId}
                            copiedToken={copiedToken}
                            copiedChatId={copiedChatId}
                            onRefresh={() => checkStatus(activeConfig.botToken)}
                            onTestPing={handleTestPing}
                            onToggleShowToken={() => setShowToken(!showToken)}
                            onToggleShowChatId={() => setShowChatId(!showChatId)}
                            onCopyToken={() => copyToClipboard(activeConfig.botToken, setCopiedToken)}
                            onCopyChatId={() => copyToClipboard(activeConfig.chatId, setCopiedChatId)}
                            onConnectWebhook={handleSetWebhook}
                            onDisconnectWebhook={handleDeleteWebhook}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

// Re-export hooks and components
export { useTelegramConfig } from './hooks';
export * from './components';
