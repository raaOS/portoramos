'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
}

const utf8_to_b64 = (str: string) => {
    return window.btoa(unescape(encodeURIComponent(str)));
};

export function useGitHubSync(csrfToken: string | null) {
    const { showSuccess, showError } = useToast();
    const [isSavingToGithub, setIsSavingToGithub] = useState(false);
    const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'disconnected'>('disconnected');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [deployStatus, setDeployStatus] = useState<'idle' | 'pushing' | 'synced' | 'failed'>('idle');

    const verifyConnection = useCallback(async (config: GitHubConfig) => {
        if (!config || !config.owner || !config.repo || !config.token) {
            return;
        }

        setConnectionStatus('checking');
        setConnectionError(null);
        try {
            const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                }
            });

            if (res.ok) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('error');
                if (res.status === 404) {
                    setConnectionError('Repo not found (check Owner/Repo)');
                } else if (res.status === 401) {
                    setConnectionError('Invalid Token');
                } else {
                    setConnectionError(`Error: ${res.status}`);
                }
            }
        } catch (e: any) {
            console.error(e);
            setConnectionStatus('error');
            setConnectionError(e.message === 'Failed to fetch' ? 'Connection Failed (Network/CORS)' : 'Network Error');
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedConfig = localStorage.getItem('github_config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                setGithubConfig(parsed);
                verifyConnection(parsed);
            }
        }
    }, [verifyConnection]);

    const saveGithubSettings = (config: GitHubConfig) => {
        localStorage.setItem('github_config', JSON.stringify(config));
        setGithubConfig(config);
        verifyConnection(config);
        showSuccess('Konfigurasi GitHub disimpan!');
    };

    const triggerGithubSync = async (skipConfirm = false) => {
        if (!skipConfirm && !confirm('Save all changes to GitHub? This will trigger a deploy.')) return;

        setIsSavingToGithub(true);
        setDeployStatus('pushing');

        try {
            const res = await fetch('/api/admin/sync', {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Sync failed');

            setDeployStatus('synced');
            showSuccess('Sinkronisasi ke GitHub berhasil & Triggered Vercel!');

            setTimeout(() => {
                setIsSavingToGithub(false);
            }, 1500);

        } catch (e: any) {
            console.error(e);
            showError(e.message || 'Sync failed');
            setDeployStatus('failed');
            setTimeout(() => {
                setDeployStatus('idle');
                setIsSavingToGithub(false);
            }, 2000);
        }
    };

    return {
        githubConfig,
        connectionStatus,
        connectionError,
        deployStatus,
        isSavingToGithub,
        saveGithubSettings,
        triggerGithubSync,
        verifyConnection
    };
}
