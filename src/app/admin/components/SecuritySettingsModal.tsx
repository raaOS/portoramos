'use client';

import { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, X } from 'lucide-react';

interface SecuritySettingsModalProps {
    onClose: () => void;
}

export default function SecuritySettingsModal({ onClose }: SecuritySettingsModalProps) {
    const [words, setWords] = useState<string[]>([]);
    const [newWord, setNewWord] = useState('');
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setWords(data.bannedWords || []);
                setLoading(false);
            })
            .catch(() => {
                showError('Failed to load settings');
                setLoading(false);
            });
    }, [showError]);

    const handleAdd = () => {
        if (!newWord.trim()) return;
        if (words.includes(newWord.trim().toLowerCase())) return;
        const updated = [...words, newWord.trim().toLowerCase()];
        setWords(updated);
        setNewWord('');
        saveSettings(updated);
    };

    const handleRemove = (wordToRemove: string) => {
        const updated = words.filter(w => w !== wordToRemove);
        setWords(updated);
        saveSettings(updated);
    };

    const saveSettings = async (updatedWords: string[]) => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannedWords: updatedWords })
            });
            if (res.ok) {
                // success but silent to avoid spamming toasts
            } else {
                showError('Failed to save settings');
            }
        } catch (e) {
            showError('Error saving settings');
        }
    };

    return (
        <AdminModal
            isOpen={true}
            onClose={onClose}
            title="Security & Moderation"
            size="md"
            actions={
                <AdminButton variant="secondary" onClick={onClose}>Close</AdminButton>
            }
        >
            <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">Banned Words List</h4>
                    <p className="text-sm text-yellow-700">
                        Comments containing any of these words will be automatically rejected.
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newWord}
                        onChange={e => setNewWord(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Add new banned word..."
                    />
                    <AdminButton onClick={handleAdd} disabled={!newWord.trim()}>Add</AdminButton>
                </div>

                <div className="min-h-[200px] border border-gray-200 rounded-md p-3 bg-gray-50 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {words.map(word => (
                                <div key={word} className="bg-white border border-gray-200 px-2 py-1 rounded text-sm flex items-center gap-2 group">
                                    <span>{word}</span>
                                    <button onClick={() => handleRemove(word)} className="text-gray-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {words.length === 0 && <span className="text-gray-400 italic">No banned words configured.</span>}
                        </div>
                    )}
                </div>
            </div>
        </AdminModal>
    );
}
