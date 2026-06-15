'use client';

import { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface SecuritySettingsModalProps {
  onClose: () => void;
}

export default function SecuritySettingsModal({ onClose }: SecuritySettingsModalProps) {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const { csrfToken } = useAdminAuth();

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
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
    const updated = words.filter((w) => w !== wordToRemove);
    setWords(updated);
    saveSettings(updated);
  };

  const saveSettings = async (updatedWords: string[]) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ bannedWords: updatedWords }),
      });
      if (res.ok) {
        // success but silent to avoid spamming toasts
      } else {
        showError('Failed to save settings');
      }
    } catch {
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
        <AdminButton variant="secondary" onClick={onClose}>
          Close
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="mb-1 text-sm font-semibold text-yellow-800">Banned Words List</h4>
          <p className="text-sm text-yellow-700">
            Comments containing any of these words will be automatically rejected.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            placeholder="Add new banned word..."
          />
          <AdminButton onClick={handleAdd} disabled={!newWord.trim()}>
            Add
          </AdminButton>
        </div>

        <div className="max-h-[240px] min-h-[120px] overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {words.map((word) => (
                <div
                  key={word}
                  className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm transition-all hover:border-gray-300"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => handleRemove(word)}
                    className="flex h-5 w-5 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    title={`Remove "${word}"`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {words.length === 0 && (
                <span className="italic text-gray-400">No banned words configured.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
