'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';

export interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
}

interface SettingsModalProps {
    initialConfig: GitHubConfig | null;
    onSave: (config: GitHubConfig) => void;
    onCancel: () => void;
}

export default function SettingsModal({ initialConfig, onSave, onCancel }: SettingsModalProps) {
    const [config, setConfig] = useState<GitHubConfig>(initialConfig || {
        token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '', // from .env.local
        owner: 'raaOS', // default
        repo: 'portoramos' // default
    });
    const [showToken, setShowToken] = useState(false);

    const isComplete = Boolean(config.token && config.owner && config.repo);

    return (
        <AdminModal
            isOpen={true}
            onClose={onCancel}
            title="GitHub Connection Settings"
            size="md"
            actions={
                <div className="flex space-x-3">
                    <AdminButton variant="secondary" onClick={onCancel}>
                        Cancel
                    </AdminButton>
                    <AdminButton
                        onClick={() => onSave(config)}
                        disabled={!isComplete}
                    >
                        Save Settings
                    </AdminButton>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-blue-800">
                        To enable saving, you must provide a GitHub Personal Access Token.
                        This token is stored securely in your browser and used to push updates directly to GitHub.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub Personal Access Token *
                    </label>
                    <div className="relative">
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={config.token}
                            onChange={(e) => setConfig({ ...config, token: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="ghp_..."
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            title={showToken ? 'Hide token' : 'Show token'}
                        >
                            {showToken ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Owner / Username *
                        </label>
                        <input
                            type="text"
                            value={config.owner}
                            onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="e.g. raaos-projects"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repo Name *
                        </label>
                        <input
                            type="text"
                            value={config.repo}
                            onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="e.g. portfolio-shared"
                        />
                    </div>
                </div>
            </div>
        </AdminModal>
    );
}

