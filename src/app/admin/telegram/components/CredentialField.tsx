'use client';

import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface CredentialFieldProps {
    label: string;
    value: string;
    show: boolean;
    copied: boolean;
    onToggleShow: () => void;
    onCopy: () => void;
}

export function CredentialField({
    label,
    value,
    show,
    copied,
    onToggleShow,
    onCopy
}: CredentialFieldProps) {
    const maskedValue = '•'.repeat(Math.min(value?.length || 10, 20));

    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <code className="flex-1 text-sm font-mono text-gray-700 truncate">
                    {show ? value : maskedValue}
                </code>
                <button onClick={onToggleShow} className="p-1 text-gray-400 hover:text-gray-700">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={onCopy} className="p-1 text-gray-400 hover:text-sky-600">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
