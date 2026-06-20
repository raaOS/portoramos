/**
 * Project AI Helper — Asisten AI untuk mengisi data proyek.
 *
 * Menggunakan Gemini API untuk menghasilkan deskripsi, caption, dan
 * komentar AI secara otomatis berdasarkan metadata proyek.
 *
 * @module components/admin/project-form/ProjectAIHelper
 */
import { useState } from 'react';
import { Sparkles, Loader2, Wand2, Activity } from 'lucide-react';
import { Comment, generateGenZComments } from '@/lib/magic';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/components/admin/ConfirmDialog';

const getCsrfToken = () => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

export interface AIResponse {
  title: string;
  description: string;
  client: string;
  tags: string[];
  type: 'commercial' | 'visual_art';
  role: string;
  team: string;
  timeline: string;
  software?: string[];
  narrative: Record<string, unknown>;
  likes?: number;
  shares?: number;
  isViralPackageRequested?: boolean;
  comments?: Comment[];
}

interface ProjectAIHelperProps {
  cover: string;
  pendingFile: File | null;
  slug: string;
  projectId?: string;
  onGenerate: (data: AIResponse) => void;
  onGenerateViral: (likes: number, shares: number, commentsCount: number, comments?: Comment[]) => void;
  existingContentFieldCount?: number;
  existingCommentCount?: number;
  mode?: 'content' | 'viral';
}

interface GenerateRequestBody {
  style: string;
  maxTitleWords: number;
  sentenceCount: number;
  imageBase64?: string;
  imageUrl?: string;
}

export default function ProjectAIHelper({
  cover,
  pendingFile,
  slug,
  projectId: _projectId,
  onGenerate,
  onGenerateViral,
  existingContentFieldCount = 0,
  existingCommentCount = 0,
  mode,
}: ProjectAIHelperProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingViral, setIsGeneratingViral] = useState(false);
  const [aiOptions, setAiOptions] = useState({
    style: 'estetik & profesional',
    maxTitleWords: 5,
    sentenceCount: 2,
  });

  // Viral AI Custom Configurations state
  const [viralOptions, setViralOptions] = useState({
    tone: 'casual',
    likes: 240,
    comments: 5,
    shares: 35,
    reply: true,
  });

  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError: showToastError } = useToast();
  const { confirm } = useConfirm();

  const showContent = !mode || mode === 'content';
  const showViral = !mode || mode === 'viral';

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!cover && !pendingFile) {
      setError('Upload media cover first!');
      return;
    }

    if (existingContentFieldCount > 0) {
      const shouldRegenerate = await confirm({
        title: 'Generate ulang konten?',
        message: `Form ini sudah punya ${existingContentFieldCount} field konten. Generate ulang akan mengganti judul, deskripsi, metadata, tags, dan narasi yang ada.`,
        confirmText: 'Generate Ulang',
        cancelText: 'Batal',
        tone: 'warning',
      });

      if (!shouldRegenerate) return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const body: GenerateRequestBody = {
        style: aiOptions.style,
        maxTitleWords: aiOptions.maxTitleWords,
        sentenceCount: aiOptions.sentenceCount,
      };

      if (pendingFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(pendingFile);
        });
        body.imageBase64 = base64;
      } else {
        body.imageUrl = cover;
      }

      const res = await fetch('/api/ai/generate-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn('AI text generation warning:', err);
        throw new Error(err.error || 'AI Generation Failed');
      }

      const data = await res.json();

      let tags = data.tags;
      if (typeof tags === 'string') {
        tags = tags.split(',').map((t: string) => t.trim());
      }

      onGenerate({
        title: data.title,
        description: data.description,
        client: data.client,
        tags: Array.isArray(tags) ? tags : [],
        type: data.type || 'visual_art',
        role: data.role || '',
        team: data.team || '',
        timeline: data.timeline || '',
        software: data.software || [],
        narrative: data.narrative || {},
      });
      showSuccess('Berhasil men-generate konten proyek! ✨');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate details';
      setError(errorMessage);
      showToastError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateViral = async () => {
    if (isGeneratingViral) return;

    if (existingCommentCount > 0) {
      const shouldRegenerate = await confirm({
        title: 'Generate ulang komentar?',
        message: `Project ini sudah punya ${existingCommentCount} komentar/balasan. Generate ulang akan mengganti komentar yang ada, bukan menambah komentar baru.`,
        confirmText: 'Generate Ulang',
        cancelText: 'Batal',
        tone: 'warning',
      });

      if (!shouldRegenerate) return;
    }

    setIsGeneratingViral(true);
    setError(null);
    try {
      let generatedComments: Comment[] = [];
      const derivedSlug = slug || 'temp-slug';

      if (_projectId) {
        try {
          const res = await fetch('/api/admin/projects/magic-complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': getCsrfToken(),
            },
            body: JSON.stringify({
              projectId: _projectId,
              slug: derivedSlug,
              likes: viralOptions.likes,
              shares: viralOptions.shares,
              commentCount: viralOptions.comments,
              tone: viralOptions.tone,
              reply: viralOptions.reply,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.comments && Array.isArray(data.comments)) {
              generatedComments = data.comments;
            }
          }
        } catch (magicErr) {
          console.warn('Magic complete API failed silently.', magicErr);
        }
      } else {
        // For new unsaved projects, generate comments on the client side
        generatedComments = generateGenZComments(
          derivedSlug,
          viralOptions.comments,
          viralOptions.tone,
          viralOptions.reply
        );
      }

      onGenerateViral(
        viralOptions.likes,
        viralOptions.shares,
        viralOptions.comments,
        generatedComments
      );
      showSuccess('Berhasil men-generate statistik & ulasan viral! 🚀');
    } catch (err: unknown) {
      console.error(err);
      setError('Gagal membuat viral stats');
      showToastError('Gagal membuat viral stats');
    } finally {
      setIsGeneratingViral(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. PROJECT CONTENT AI ASSISTANT */}
      {showContent && (
        <div className="relative overflow-hidden rounded-xl border border-indigo-100/80 bg-indigo-50/5 p-4 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-50/60 dark:border-indigo-950/40 pb-2.5">
              <div className="rounded bg-indigo-600/10 p-1 text-indigo-600">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Project AI Assistant</h3>
                <p className="font-mono text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Konten & Salin Proyek
                </p>
              </div>
            </div>

            {/* Style Configuration */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4 items-end">
              <div className="sm:col-span-2">
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Gaya Bahasa
                </label>
                <select
                  value={aiOptions.style}
                  onChange={(e) => setAiOptions((prev) => ({ ...prev, style: e.target.value }))}
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                >
                  <option value="estetik & profesional">Estetik & Profesional</option>
                  <option value="minimalis & elegan">Minimalis & Elegan</option>
                  <option value="kreatif & berapi-api">Kreatif & Berapi-api</option>
                  <option value="poetis & mendalam">Poetis & Mendalam</option>
                  <option value="santai & trendi">Santai & Trendi</option>
                  <option value="Gen-Z (Casual/Chill)">Gen-Z (Casual/Chill)</option>
                </select>
              </div>

              <div>
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Max Kata
                </label>
                <input
                  type="number"
                  value={aiOptions.maxTitleWords}
                  onChange={(e) =>
                    setAiOptions((prev) => ({ ...prev, maxTitleWords: parseInt(e.target.value) || 5 }))
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-xs font-mono text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                  min="1"
                  max="15"
                />
              </div>

              <div>
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Kalimat
                </label>
                <input
                  type="number"
                  value={aiOptions.sentenceCount}
                  onChange={(e) =>
                    setAiOptions((prev) => ({ ...prev, sentenceCount: parseInt(e.target.value) || 2 }))
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-xs font-mono text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                  min="1"
                  max="5"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (!cover && !pendingFile)}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-indigo-600 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:pointer-events-none disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 uppercase tracking-wider"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  <span>{existingContentFieldCount > 0 ? 'Regenerate Konten' : 'Generate Konten'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. VIRAL AI ASSISTANT */}
      {showViral && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 p-4 shadow-sm">
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="rounded bg-slate-200 dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-400">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Viral Stats AI Simulator</h3>
                <p className="font-mono text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Metrik Populer & Komentar
                </p>
              </div>
            </div>

            {/* Viral Configuration Inputs Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Gaya Bahasa
                </label>
                <select
                  value={viralOptions.tone}
                  onChange={(e) => setViralOptions((prev) => ({ ...prev, tone: e.target.value }))}
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                >
                  <option value="casual">Gen-Z / Casual</option>
                  <option value="aesthetic">Estetik / Pujian</option>
                  <option value="tech">Teknis / Mendalam</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex cursor-pointer items-center justify-between rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 transition-colors">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Balas Komentar
                  </span>
                  <input
                    type="checkbox"
                    checked={viralOptions.reply}
                    onChange={(e) => setViralOptions((prev) => ({ ...prev, reply: e.target.checked }))}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 h-3.5 w-3.5"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Likes
                </label>
                <input
                  type="number"
                  value={viralOptions.likes}
                  onChange={(e) =>
                    setViralOptions((prev) => ({ ...prev, likes: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-xs font-mono text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                  min="0"
                />
              </div>

              <div>
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Komentar
                </label>
                <input
                  type="number"
                  value={viralOptions.comments}
                  onChange={(e) =>
                    setViralOptions((prev) => ({ ...prev, comments: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-xs font-mono text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label className="mb-0.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Share
                </label>
                <input
                  type="number"
                  value={viralOptions.shares}
                  onChange={(e) =>
                    setViralOptions((prev) => ({ ...prev, shares: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-xs font-mono text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-800 focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                  min="0"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateViral}
              disabled={isGeneratingViral}
              className="flex w-full items-center justify-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 hover:border-slate-800 dark:hover:border-slate-400 bg-white dark:bg-slate-900 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-95 disabled:pointer-events-none disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-650 uppercase tracking-wider"
            >
              {isGeneratingViral ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <span>{existingCommentCount > 0 ? 'Regenerate Viral Stats' : 'Generate Viral Stats'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-100 bg-red-50/50 px-2.5 py-1.5 text-[10px] font-medium text-red-600">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
