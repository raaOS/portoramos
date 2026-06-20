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

function normalizeWordInput(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseWordsInput(value: string): string[] {
  return Array.from(new Set(value.split(/[,\n]/).map(normalizeWordInput).filter(Boolean)));
}

function normalizeWords(words: string[]): string[] {
  return Array.from(new Set(words.map(normalizeWordInput).filter(Boolean)));
}

export default function SecuritySettingsModal({ onClose }: SecuritySettingsModalProps) {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();
  const { csrfToken } = useAdminAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch('/api/settings', { credentials: 'include' });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data.bannedWords)) {
          throw new Error('Banned words settings are unavailable for this session');
        }

        if (!cancelled) {
          setLoadError(null);
          setWords(normalizeWords(data.bannedWords));
        }
      } catch {
        if (!cancelled) {
          setLoadError('Moderation settings unavailable. Please re-login as admin.');
          showError('Failed to load moderation settings. Please re-login as admin.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [showError]);

  const handleAdd = async () => {
    const additions = parseWordsInput(newWord);
    if (additions.length === 0) return;

    const updated = normalizeWords([...words, ...additions]);
    if (updated.length === words.length) {
      setNewWord('');
      return;
    }

    const saved = await saveSettings(updated);
    if (saved) {
      setNewWord('');
    }
  };

  const handleRemove = async (wordToRemove: string) => {
    const updated = words.filter((w) => w !== wordToRemove);
    await saveSettings(updated);
  };

  const saveSettings = async (updatedWords: string[]): Promise<boolean> => {
    const normalizedWords = normalizeWords(updatedWords);
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ bannedWords: normalizedWords }),
      });
      if (res.ok) {
        const data = await res.json();
        const savedWords = Array.isArray(data.settings?.bannedWords)
          ? data.settings.bannedWords
          : normalizedWords;

        setWords(normalizeWords(savedWords));
        setLastSavedAt(new Date().toLocaleTimeString('id-ID', { hour12: false }));
        showSuccess('Moderation settings saved');
        return true;
      }

      showError('Failed to save settings');
    } catch {
      showError('Error saving settings');
    } finally {
      setSaving(false);
    }

    return false;
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
          <div className="mb-1 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-yellow-800">Banned Words List</h4>
            <span className="text-xs font-medium text-yellow-700">{words.length} active</span>
          </div>
          <p className="text-sm text-yellow-700">
            Comments and feedback containing these words, including common obfuscation, will be
            rejected.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            placeholder="Add word or comma-separated list..."
            disabled={loading || saving || Boolean(loadError)}
          />
          <AdminButton
            onClick={handleAdd}
            disabled={!newWord.trim() || loading || Boolean(loadError)}
            loading={saving}
          >
            Add
          </AdminButton>
        </div>

        <div className="max-h-[240px] min-h-[120px] overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
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
                    disabled={saving}
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

        <div className="min-h-5 text-xs text-gray-500" aria-live="polite">
          {saving ? 'Saving moderation rules...' : lastSavedAt ? `Saved at ${lastSavedAt}` : null}
        </div>
      </div>
    </AdminModal>
  );
}
