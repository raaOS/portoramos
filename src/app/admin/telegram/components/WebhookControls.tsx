'use client';

interface WebhookControlsProps {
    webhookUrl?: string;
    loading: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}

export function WebhookControls({
    webhookUrl,
    loading,
    onConnect,
    onDisconnect
}: WebhookControlsProps) {
    const isConnected = !!webhookUrl;

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
                <h4 className="text-sm font-semibold text-slate-800">Webhook Status</h4>
                <p className="text-xs text-slate-500 mt-1">
                    {isConnected
                        ? `Active: ${webhookUrl}`
                        : 'Not connected. Bot performs one-way alerts only.'}
                </p>
            </div>
            <div>
                {isConnected ? (
                    <button
                        onClick={onDisconnect}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-medium transition"
                    >
                        {loading ? 'Disconnecting...' : 'Disconnect Webhook'}
                    </button>
                ) : (
                    <button
                        onClick={onConnect}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md font-medium transition"
                    >
                        {loading ? 'Connecting...' : 'Connect Webhook'}
                    </button>
                )}
            </div>
        </div>
    );
}
