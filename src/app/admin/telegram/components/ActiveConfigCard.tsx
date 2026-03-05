'use client';

import { Shield } from 'lucide-react';
import type { TelegramConfig, BotStatus, TestResult } from '../hooks';
import { BotStatusCard } from './BotStatusCard';
import { CredentialField } from './CredentialField';
import { WebhookControls } from './WebhookControls';

interface ActiveConfigCardProps {
    config: TelegramConfig;
    status: BotStatus | null;
    loading: boolean;
    testing: boolean;
    testResult: TestResult | null;
    webhookInfo: { url?: string } | null;
    webhookLoading: boolean;
    showToken: boolean;
    showChatId: boolean;
    copiedToken: boolean;
    copiedChatId: boolean;
    onRefresh: () => void;
    onTestPing: () => void;
    onToggleShowToken: () => void;
    onToggleShowChatId: () => void;
    onCopyToken: () => void;
    onCopyChatId: () => void;
    onConnectWebhook: () => void;
    onDisconnectWebhook: () => void;
}

export function ActiveConfigCard({
    config,
    status,
    loading,
    testing,
    testResult,
    webhookInfo,
    webhookLoading,
    showToken,
    showChatId,
    copiedToken,
    copiedChatId,
    onRefresh,
    onTestPing,
    onToggleShowToken,
    onToggleShowChatId,
    onCopyToken,
    onCopyChatId,
    onConnectWebhook,
    onDisconnectWebhook
}: ActiveConfigCardProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Active Configuration
                </h3>
                {config.isCustom ? (
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium border border-orange-200">
                        Custom Override
                    </span>
                ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium border border-gray-200">
                        Environment Default
                    </span>
                )}
            </div>

            {/* Status Card */}
            <BotStatusCard
                status={status}
                loading={loading}
                testing={testing}
                testResult={testResult}
                activeConfig={config}
                onRefresh={onRefresh}
                onTestPing={onTestPing}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                    <hr className="border-gray-100" />

                    {/* Read-Only Credentials */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <CredentialField
                            label="Active Token"
                            value={config.botToken}
                            show={showToken}
                            copied={copiedToken}
                            onToggleShow={onToggleShowToken}
                            onCopy={onCopyToken}
                        />

                        <CredentialField
                            label="Active Chat ID"
                            value={config.chatId}
                            show={showChatId}
                            copied={copiedChatId}
                            onToggleShow={onToggleShowChatId}
                            onCopy={onCopyChatId}
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Webhook Controls */}
                    <WebhookControls
                        webhookUrl={webhookInfo?.url}
                        loading={webhookLoading}
                        onConnect={onConnectWebhook}
                        onDisconnect={onDisconnectWebhook}
                    />
                </div>
            </div>
        </section>
    );
}
